/**
 * 送電試験（Phase 1〜3）基底共通 Composable (Local-First Architecture)
 *
 * @description 回路データのローカル IndexedDB 永続化、リアルタイム幹線連動ロック計算、
 * ゼロレイテンシ楽観的更新、および非同期同期パイプライン（Outbox パターン）の基盤を提供します。
 */

import type { Ref } from 'vue'
import { computed, ref, unref, watch } from 'vue'

import { useNuxtApp } from '#app'
import type { CircuitItem, CircuitsResponse, PanelOption } from '#shared/types/circuit'
import { isPhaseComplete } from '#shared/utils/soudenExam'
import { useOfflineSync } from '~/composables/portal/useOfflineSync'
import { useAuth } from '~/composables/useAuth'
import { CircuitsRepository, SiteSettingsRepository } from '~/utils/db'
import { AppException } from '~/utils/errors'

export interface PhaseExamFeedbackOptions {
  onConflict?: (message: string) => void
  onError?: (message: string) => void
  onConfirmClear?: (message: string) => boolean | Promise<boolean>
}

export interface ConfirmPhase1Payload {
  kakunin?: boolean
  mashishime?: boolean
  remarks?: string
  [key: string]: unknown
}

export interface ConfirmPhase2Payload {
  rVal?: number | null
  sVal?: number | null
  tVal?: number | null
  rStatus?: string | null
  sStatus?: string | null
  tStatus?: string | null
  remarks?: string
  isComplete?: boolean
}

export interface ConfirmPhase3Payload {
  rs?: number | null
  st?: number | null
  rt?: number | null
  kensou?: string | null
  remarks?: string
  isComplete?: boolean
}

/**
 * 送電試験（Phase 1〜3）の基底共通Composable
 */
export function usePhaseExamBase(
  siteIdRef: Ref<string> | string,
  initialKeiTo: string = '幹線',
  phaseNumber: number = 1,
  feedbackOptions?: PhaseExamFeedbackOptions,
) {
  const { getAccurateNow, currentUser } = useAuth()
  const { enqueue, removeQueueItem } = useOfflineSync(siteIdRef)
  const { $api } = useNuxtApp()

  const circuits = ref<CircuitItem[]>([])
  const panelOptions = ref<PanelOption[]>([])
  const serverPanelsWithIncompleteKansen = ref<string[]>([])
  const phase2ThresholdMegOhm = ref<number>(1.0)
  const isLoading = ref(false)
  const isActionLoading = ref<Record<string, boolean>>({})
  const error = ref<string | null>(null)

  const selectedKeiTo = ref<string>(initialKeiTo)
  const selectedBanShubetsu = ref<string>('ALL')
  const selectedBanMeisho = ref<string>('ALL')

  // ネットワーク・圏外エラー判定ヘルパー
  const isNetworkError = (err: unknown): boolean => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return true
    }

    const e = err as { name?: string, message?: string, statusCode?: number, status?: number }

    if (e?.name === 'TypeError' && (e?.message?.includes('fetch') || e?.message?.includes('Network'))) {
      return true
    }

    const status = e?.statusCode || e?.status

    // ネットワーク未到達、ゲートウェイタイムアウト、サーバー一時障害はオフライン扱い
    if (!status || status === 408 || status === 502 || status === 503 || status === 504) {
      return true
    }

    return false
  }

  // クライアント側の回路データから panelOptions を自動補完生成
  const derivePanelOptions = (items: CircuitItem[]): PanelOption[] => {
    const map = new Map<string, PanelOption>()

    for (const c of items) {
      if (c.banMeisho) {
        const key = `${c.banShubetsu}___${c.banMeisho}`

        if (!map.has(key)) {
          map.set(key, {
            banShubetsu: c.banShubetsu || 'その他',
            banMeisho: c.banMeisho,
          })
        }
      }
    }

    return Array.from(map.values())
  }

  // 回路一覧データの取得 (Local-First: IndexedDB即座読込 -> バックグラウンド同期)
  const fetchCircuits = async (_forceRemote = false) => {
    const siteId = unref(siteIdRef)

    if (!siteId) return

    error.value = null

    // 1. まずローカル IndexedDB から即座に読み込み (0ms / オフライン完全保証)
    try {
      const [localCircuits, localSettings] = await Promise.all([
        CircuitsRepository.getBySite(siteId),
        SiteSettingsRepository.get(siteId),
      ])

      if (localSettings && typeof localSettings.phase2ThresholdMegOhm === 'number') {
        phase2ThresholdMegOhm.value = localSettings.phase2ThresholdMegOhm
      }

      if (localCircuits && localCircuits.length > 0) {
        circuits.value = localCircuits
        if (panelOptions.value.length === 0) {
          panelOptions.value = derivePanelOptions(localCircuits)
        }
      }
      else {
        isLoading.value = true
      }
    }
    catch (err) {
      console.warn('[Local-First] Failed to read from IndexedDB, fallback to network', err)
      isLoading.value = true
    }

    // 2. ネットワーク接続があればバックグラウンドで最新データをフェッチして IndexedDB を更新
    try {
      const params = new URLSearchParams()
      // 全回路をローカルキャッシュとして保持するため keiTo パラメータは ALL で取得
      const res = await $api<CircuitsResponse>(`/api/sites/${siteId}/circuits?${params.toString()}`)

      if (res && res.circuits) {
        circuits.value = res.circuits
        panelOptions.value = res.panelOptions || derivePanelOptions(res.circuits)
        serverPanelsWithIncompleteKansen.value = res.panelsWithIncompleteKansen || []
        if (typeof res.phase2ThresholdMegOhm === 'number') {
          phase2ThresholdMegOhm.value = res.phase2ThresholdMegOhm

          // 現場設定もローカル IndexedDB に保持
          const existing = await SiteSettingsRepository.get(siteId)

          if (existing) {
            await SiteSettingsRepository.put({
              ...existing,
              phase2ThresholdMegOhm: res.phase2ThresholdMegOhm,
            })
          }
        }

        // IndexedDB に最新マスターを非同期保存
        await CircuitsRepository.putAll(res.circuits)
      }
    }
    catch (err: unknown) {
      // オフラインまたは通信失敗時は、ローカルにデータがあればエラーにしない
      if (circuits.value.length === 0) {
        const e = err as Error

        error.value = e.message || '通信エラーが発生しました'
      }
    }
    finally {
      isLoading.value = false
    }
  }

  // 盤種別の選択肢リスト
  const availableShubetsuList = computed(() => {
    const set = new Set<string>()

    panelOptions.value.forEach(p => set.add(p.banShubetsu))

    return ['ALL', ...Array.from(set)]
  })

  // 盤種別タブ用選択肢リスト（UI標準フォーマット）
  const shubetsuTabOptions = computed(() => {
    return availableShubetsuList.value.map(s => ({
      label: s === 'ALL' ? 'すべて' : s,
      value: s,
    }))
  })

  // 系統切替時に盤種別・盤名称をALLへリセット
  watch(selectedKeiTo, () => {
    selectedBanShubetsu.value = 'ALL'
    selectedBanMeisho.value = 'ALL'
  })

  // 選択された種別に属する盤名称の選択肢リスト
  const availableBanMeishoList = computed(() => {
    const filtered = selectedBanShubetsu.value === 'ALL'
      ? panelOptions.value
      : panelOptions.value.filter(p => p.banShubetsu === selectedBanShubetsu.value)

    const set = new Set<string>()

    filtered.forEach((p) => {
      if (p.banMeisho) {
        set.add(p.banMeisho)
      }
    })

    const sorted = Array.from(set).sort((a, b) =>
      a.localeCompare(b, 'ja', { numeric: true, sensitivity: 'base' }),
    )

    const list = sorted.map(m => ({ label: m, value: m }))

    return [{ label: 'すべての盤', value: 'ALL' }, ...list]
  })

  // 系統・盤種別・盤名称でフィルタリングした表示用回路一覧
  const filteredCircuits = computed(() => {
    return circuits.value.filter((c) => {
      // 系統フィルタ (ALL以外の場合)
      if (selectedKeiTo.value && selectedKeiTo.value !== 'ALL' && c.keiTo !== selectedKeiTo.value) {
        return false
      }

      if (selectedBanShubetsu.value !== 'ALL' && c.banShubetsu !== selectedBanShubetsu.value) {
        return false
      }

      if (selectedBanMeisho.value !== 'ALL' && c.banMeisho !== selectedBanMeisho.value) {
        return false
      }

      return true
    })
  })

  // 回路が三相・動力系かどうかの判定
  const isThreePhase = (c: CircuitItem): boolean => {
    const h = (c.haidenHoushiki || '').toLowerCase()
    const s = (c.souShubetsu || '').toLowerCase()
    const k = (c.kairoMeisho || '').toLowerCase()

    return (
      h.includes('3φ')
      || h.includes('3相')
      || h.includes('三相')
      || h.includes('動力')
      || s.includes('3φ')
      || s.includes('3相')
      || s.includes('三相')
      || s.includes('動力')
      || k.includes('動力')
    )
  }

  // フィルタ後の進捗統計
  const phaseStats = computed(() => {
    const list = filteredCircuits.value
    let completed = 0
    let excluded = 0
    let total = 0

    for (const c of list) {
      if (c.isExcluded) {
        excluded++
      }
      else {
        total++
        if (isPhaseComplete(c, phaseNumber)) {
          completed++
        }
      }
    }

    const pct = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      allCount: list.length,
      total,
      completed,
      excluded,
      pct,
    }
  })

  // 【Local-Firstリアクティブ計算】幹線未完了の盤リスト（進捗参照用）
  const panelsWithIncompleteKansen = computed<string[]>({
    get: () => {
      const set = new Set<string>(serverPanelsWithIncompleteKansen.value)
      const kansenCircuits = circuits.value.filter(c => c.keiTo === '幹線' && !c.isExcluded)

      for (const c of kansenCircuits) {
        if (!isPhaseComplete(c, 1) || !isPhaseComplete(c, 2) || !isPhaseComplete(c, 3)) {
          set.add(c.banMeisho)
        }
      }

      return Array.from(set)
    },
    set: (val: string[]) => {
      serverPanelsWithIncompleteKansen.value = val
    },
  })

  // 幹線を試験する前に二次側のチェックを行えるようにするため、幹線→二次側のロックは撤廃（常にfalse）
  const isCircuitLocked = (_circuit: CircuitItem): boolean => false

  const notifyConflict = feedbackOptions?.onConflict || ((msg: string) => {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(msg)
    }
  })

  const notifyError = feedbackOptions?.onError || ((msg: string) => {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(msg)
    }
  })

  const askConfirmClear = feedbackOptions?.onConfirmClear || ((msg: string) => {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      return window.confirm(msg)
    }

    return true
  })

  // 排他制御 (409 Conflict) エラーの共通ハンドリング
  const handleConflictError = async (circuitId: string, err: unknown): Promise<boolean> => {
    const isConflict = (err instanceof AppException && err.isConflict())
      || (err as { statusCode?: number, status?: number })?.statusCode === 409
      || (err as { statusCode?: number, status?: number })?.status === 409

    if (isConflict) {
      const appErr = err instanceof AppException ? err : null
      const fetchErr = err as {
        data?: {
          message?: string
          data?: { currentCircuit?: CircuitItem }
        }
        details?: Record<string, unknown>
        originalError?: {
          data?: { data?: { currentCircuit?: CircuitItem }, current?: CircuitItem }
          current?: CircuitItem
        }
      }

      const current = (appErr?.details as { currentCircuit?: CircuitItem })?.currentCircuit
        || fetchErr.data?.data?.currentCircuit
        || fetchErr.originalError?.data?.data?.currentCircuit
        || fetchErr.originalError?.current

      if (current) {
        updateLocalCircuit(circuitId, current)
        await CircuitsRepository.put(current)
      }

      const conflictMsg = appErr?.message
        || fetchErr.data?.message
        || '他の作業者によってこの回路が更新されました。最新状態を反映しました。'

      notifyConflict(conflictMsg)

      return true
    }

    return false
  }

  // 作業者名の取得ヘルパー
  const getWorkerName = (): string => {
    if (currentUser.value) {
      return `${currentUser.value.lastName} ${currentUser.value.firstName}`.trim() || currentUser.value.loginId
    }

    return '現場作業者'
  }

  // ローカル回路配列の更新ヘルパー
  const updateLocalCircuit = (circuitId: string, patch: Partial<CircuitItem>) => {
    const idx = circuits.value.findIndex(c => c.id === circuitId)

    if (idx !== -1 && circuits.value[idx]) {
      circuits.value[idx] = {
        ...circuits.value[idx]!,
        ...patch,
      }
    }
  }

  // 回路アクション（Phase 1〜3 確定・解除）の共通実行パイプライン (Local-First)
  const executeCircuitAction = async (
    circuit: CircuitItem,
    actionType: 'confirm' | 'clear',
    payload: Record<string, unknown>,
    optimisticPatch: Partial<CircuitItem>,
  ) => {
    const siteId = unref(siteIdRef)

    if (!siteId) return

    isActionLoading.value[circuit.id] = true
    const clientConfirmedAt = getAccurateNow().toISOString()
    const workerName = getWorkerName()

    // 1. 【Local-First】 IndexedDB と UI メモリを即座に更新 (0ms レスポンス)
    const localPatch: Partial<CircuitItem> = {
      ...optimisticPatch,
      ...(actionType === 'confirm' ? { clientConfirmedAt, workerName } : {}),
    }

    updateLocalCircuit(circuit.id, localPatch)
    await CircuitsRepository.patch(circuit.id, localPatch)

    // 2. 【Outbox パターン】 送信待ちキューを IndexedDB に永続化
    const enqueuedRecord = await enqueue({
      siteId,
      circuitId: circuit.id,
      banMeisho: circuit.banMeisho,
      kairoBangou: circuit.kairoBangou || '',
      kairoMeisho: circuit.kairoMeisho || '',
      phase: phaseNumber as 1 | 2 | 3,
      actionType,
      payload,
      clientConfirmedAt,
      expectedUpdatedAt: circuit.updatedAt,
      expectedVersion: circuit.version,
      workerName,
    })

    // 3. オンライン接続がある場合は直ちにサーバー送信を試行
    const endpoint = `/api/sites/${siteId}/circuits/${circuit.id}/phase${phaseNumber}${actionType === 'clear' ? '/clear' : ''}`
    const body = {
      ...payload,
      clientConfirmedAt,
      expectedUpdatedAt: circuit.updatedAt,
      expectedVersion: circuit.version,
    }

    try {
      const res = await $api<{ success: boolean, circuit: CircuitItem }>(endpoint, {
        method: 'POST',
        body,
      })

      if (res?.circuit) {
        updateLocalCircuit(circuit.id, res.circuit)
        await CircuitsRepository.put(res.circuit)
        // 成功したためキューから除去
        if (enqueuedRecord) {
          await removeQueueItem(enqueuedRecord.id)
        }
      }

      return res
    }
    catch (err: unknown) {
      if (await handleConflictError(circuit.id, err)) {
        return
      }

      // オフラインまたはネットワークエラー時はローカル確定で正常終了 (キューに残る)
      if (isNetworkError(err)) {
        return { success: true, isOffline: true }
      }

      const e = err as Error
      const actionName = actionType === 'confirm' ? `確定` : `確定解除`

      notifyError(`${actionName}に失敗しました: ${e.message}`)
      throw err
    }
    finally {
      isActionLoading.value[circuit.id] = false
    }
  }

  // --- Phase 1 専用アクション ---
  const confirmPhase1 = async (
    circuit: CircuitItem,
    overrideData?: ConfirmPhase1Payload,
  ) => {
    const finalKakunin = overrideData?.kakunin !== undefined
      ? Boolean(overrideData.kakunin)
      : Boolean(circuit.p1Kakunin)
    const finalMashishime = overrideData?.mashishime !== undefined
      ? Boolean(overrideData.mashishime)
      : Boolean(circuit.p1Mashishime)
    const hasAnyCheck = finalKakunin || finalMashishime

    const payload: ConfirmPhase1Payload = {
      kakunin: finalKakunin,
      mashishime: finalMashishime,
      remarks: overrideData?.remarks ?? circuit.p1Remarks ?? '',
      ...overrideData,
    }

    const nowIso = getAccurateNow().toISOString()
    const workerName = getWorkerName()

    const optimisticPatch: Partial<CircuitItem> = {
      p1Kakunin: finalKakunin,
      p1Mashishime: finalMashishime,
      p1Remarks: String(payload.remarks || ''),
      p1ConfirmedAt: hasAnyCheck ? nowIso : null,
      p1Worker: hasAnyCheck ? workerName : null,
    }

    return executeCircuitAction(circuit, 'confirm', payload, optimisticPatch)
  }

  // --- Phase 2 専用アクション ---
  const evalMegStatus = (val: number | string | null | undefined): 'OK' | 'NG' | null => {
    if (val === null || val === undefined || val === '') return null
    const num = typeof val === 'number' ? val : parseFloat(String(val))

    if (isNaN(num)) return null

    return num >= phase2ThresholdMegOhm.value ? 'OK' : 'NG'
  }

  const confirmPhase2 = async (
    circuit: CircuitItem,
    payload: ConfirmPhase2Payload,
  ) => {
    const optimisticPatch: Partial<CircuitItem> = {
      zetsuenR: payload.rVal !== undefined ? payload.rVal : circuit.zetsuenR,
      zetsuenS: payload.sVal !== undefined ? payload.sVal : circuit.zetsuenS,
      zetsuenT: payload.tVal !== undefined ? payload.tVal : circuit.zetsuenT,
      p2RStatus: payload.rStatus !== undefined ? payload.rStatus : circuit.p2RStatus,
      p2SStatus: payload.sStatus !== undefined ? payload.sStatus : circuit.p2SStatus,
      p2TStatus: payload.tStatus !== undefined ? payload.tStatus : circuit.p2TStatus,
      p2Remarks: payload.remarks !== undefined ? payload.remarks : circuit.p2Remarks,
      p2IsComplete: payload.isComplete !== undefined ? payload.isComplete : true,
    }

    return executeCircuitAction(circuit, 'confirm', payload as Record<string, unknown>, optimisticPatch)
  }

  const clearPhase2 = async (circuit: CircuitItem) => {
    const isOk = await askConfirmClear(`盤「${circuit.banMeisho}」回路「${circuit.kairoBangou || circuit.kairoMeisho}」のフェーズ2確定を解除しますか？`)

    if (!isOk) {
      return
    }

    const optimisticPatch: Partial<CircuitItem> = {
      zetsuenR: null,
      zetsuenS: null,
      zetsuenT: null,
      p2RStatus: null,
      p2SStatus: null,
      p2TStatus: null,
      p2Worker: null,
      p2ConfirmedAt: null,
      p2IsComplete: false,
    }

    return executeCircuitAction(circuit, 'clear', {}, optimisticPatch)
  }

  // --- Phase 3 専用アクション ---
  const confirmPhase3 = async (
    circuit: CircuitItem,
    payload: ConfirmPhase3Payload,
  ) => {
    const optimisticPatch: Partial<CircuitItem> = {
      denatsuRs: payload.rs !== undefined ? payload.rs : circuit.denatsuRs,
      denatsuSt: payload.st !== undefined ? payload.st : circuit.denatsuSt,
      denatsuRt: payload.rt !== undefined ? payload.rt : circuit.denatsuRt,
      kensou: payload.kensou !== undefined ? payload.kensou : circuit.kensou,
      p3Remarks: payload.remarks !== undefined ? payload.remarks : circuit.p3Remarks,
      p3IsComplete: payload.isComplete !== undefined ? payload.isComplete : true,
    }

    return executeCircuitAction(circuit, 'confirm', payload as Record<string, unknown>, optimisticPatch)
  }

  const clearPhase3 = async (circuit: CircuitItem) => {
    const isOk = await askConfirmClear(`盤「${circuit.banMeisho}」回路「${circuit.kairoBangou || circuit.kairoMeisho}」のフェーズ3確定を解除しますか？`)

    if (!isOk) {
      return
    }

    const optimisticPatch: Partial<CircuitItem> = {
      denatsuRs: null,
      denatsuSt: null,
      denatsuRt: null,
      kensou: null,
      p3Worker: null,
      p3ConfirmedAt: null,
      p3IsComplete: false,
    }

    return executeCircuitAction(circuit, 'clear', {}, optimisticPatch)
  }

  return {
    siteIdRef,
    phaseNumber,
    circuits,
    panelOptions,
    panelsWithIncompleteKansen,
    phase2ThresholdMegOhm,
    isLoading,
    isActionLoading,
    error,
    selectedKeiTo,
    selectedBanShubetsu,
    selectedBanMeisho,
    availableShubetsuList,
    shubetsuTabOptions,
    availableBanMeishoList,
    filteredCircuits,
    phaseStats,
    fetchCircuits,
    isThreePhase,
    isCircuitLocked,
    getWorkerName,
    getAccurateNow,
    executeCircuitAction,
    askConfirmClear,
    confirmPhase1,
    evalMegStatus,
    confirmPhase2,
    clearPhase2,
    confirmPhase3,
    clearPhase3,
  }
}

export function usePhase1Exam(
  siteIdRef: Ref<string> | string,
  initialKeiTo: string = '幹線',
  feedbackOptions?: PhaseExamFeedbackOptions,
) {
  return usePhaseExamBase(siteIdRef, initialKeiTo, 1, feedbackOptions)
}

export function usePhase2Exam(
  siteIdRef: Ref<string> | string,
  initialKeiTo: string = '幹線',
  feedbackOptions?: PhaseExamFeedbackOptions,
) {
  return usePhaseExamBase(siteIdRef, initialKeiTo, 2, feedbackOptions)
}

export function usePhase3Exam(
  siteIdRef: Ref<string> | string,
  initialKeiTo: string = '幹線',
  feedbackOptions?: PhaseExamFeedbackOptions,
) {
  return usePhaseExamBase(siteIdRef, initialKeiTo, 3, feedbackOptions)
}
