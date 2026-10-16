/**
 * 送電試験（Phase 1〜3）基底共通 Composable (Local-First Architecture)
 *
 * @description 回路データのローカル IndexedDB 永続化、リアルタイム幹線連動ロック計算、
 * ゼロレイテンシ楽観的更新、および非同期同期パイプライン（Outbox パターン）の基盤を提供します。
 */

import type { Ref } from 'vue'
import { computed, ref, unref, watch } from 'vue'

import { useNuxtApp } from '#app'
import type { CircuitActionResponse, CircuitItem, CircuitsResponse, PanelOption } from '#shared/types/circuit'
import { isPhaseComplete } from '#shared/utils/soudenExam'
import { getUserDisplayName } from '#shared/utils/user'
import { useOfflineSync } from '~/composables/portal/useOfflineSync'
import { useAuth } from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'
import { CircuitsRepository } from '~/utils/db'
import { AppException, getErrorMessage, isNetworkError } from '~/utils/errors'

interface PhaseExamFeedbackOptions {
  onConflict?: (message: string) => void
  onError?: (message: string) => void
}

interface ConfirmPhase1Payload {
  kakunin?: boolean
  mashishime?: boolean
  mashishimeCubicle?: boolean
  remarks?: string
  remarksOnly?: boolean
  [key: string]: unknown
}

interface ConfirmPhase2Payload {
  rVal?: number | null
  sVal?: number | null
  tVal?: number | null
  rStatus?: string | null
  sStatus?: string | null
  tStatus?: string | null
  remarks?: string
  isComplete?: boolean
  remarksOnly?: boolean
}

interface ConfirmPhase3Payload {
  rs?: number | null
  st?: number | null
  rt?: number | null
  kensou?: string | null
  remarks?: string
  isComplete?: boolean
  remarksOnly?: boolean
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
  const isLoading = ref(true)
  const isActionLoading = ref<Record<string, boolean>>({})

  const selectedKeiTo = ref<string>(initialKeiTo)
  const selectedBanShubetsu = ref<string>('ALL')
  const selectedFloor = ref<string>('ALL')
  const selectedBanMeisho = ref<string>('ALL')

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

    if (!siteId) {
      isLoading.value = false

      return
    }

    // 1. まずローカル IndexedDB から即座に読み込み (0ms / オフライン完全保証)
    try {
      const localCircuits = await CircuitsRepository.getBySite(siteId)

      if (localCircuits && localCircuits.length > 0) {
        circuits.value = localCircuits
        if (panelOptions.value.length === 0) {
          panelOptions.value = derivePanelOptions(localCircuits)
        }
        isLoading.value = false
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

        // IndexedDB に最新マスターを非同期保存
        await CircuitsRepository.putAll(res.circuits)
      }
    }
    catch {
      // オフラインまたは通信失敗時はローカルデータを維持
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

  // 系統切替時に盤種別・エリア・盤名称をALLへリセット
  watch(selectedKeiTo, () => {
    selectedBanShubetsu.value = 'ALL'
    selectedFloor.value = 'ALL'
    selectedBanMeisho.value = 'ALL'
  })

  // エリアの選択肢リスト（選択中の系統・盤種別に属する一意なエリアを自然順ソート）
  const availableFloorList = computed(() => {
    const targetCircuits = circuits.value.filter((c) => {
      if (selectedKeiTo.value && selectedKeiTo.value !== 'ALL' && c.keiTo !== selectedKeiTo.value) {
        return false
      }
      if (selectedBanShubetsu.value !== 'ALL' && c.banShubetsu !== selectedBanShubetsu.value) {
        return false
      }

      return true
    })

    const set = new Set<string>()
    let hasUnset = false

    for (const c of targetCircuits) {
      const f = (c.floor || '').trim()

      if (f) {
        set.add(f)
      }
      else {
        hasUnset = true
      }
    }

    const sorted = Array.from(set).sort((a, b) =>
      a.localeCompare(b, 'ja', { numeric: true, sensitivity: 'base' }),
    )

    const options = [{ label: 'すべてのエリア', value: 'ALL' }]

    for (const f of sorted) {
      options.push({ label: f, value: f })
    }

    if (hasUnset && set.size > 0) {
      options.push({ label: 'エリア未設定', value: '__UNSET__' })
    }

    return options
  })

  // 選択中エリアの整合性担保（存在しないエリアになった場合はALLへリセット）
  watch(availableFloorList, (opts) => {
    if (selectedFloor.value !== 'ALL' && !opts.some(o => o.value === selectedFloor.value)) {
      selectedFloor.value = 'ALL'
    }
  })

  // 選択された種別・エリアに属する盤名称の選択肢リスト
  const availableBanMeishoList = computed(() => {
    const set = new Set<string>()

    if (circuits.value.length > 0) {
      for (const c of circuits.value) {
        if (selectedKeiTo.value && selectedKeiTo.value !== 'ALL' && c.keiTo !== selectedKeiTo.value) {
          continue
        }
        if (selectedBanShubetsu.value !== 'ALL' && c.banShubetsu !== selectedBanShubetsu.value) {
          continue
        }
        if (selectedFloor.value !== 'ALL') {
          const floorVal = (c.floor || '').trim()

          if (selectedFloor.value === '__UNSET__') {
            if (floorVal) continue
          }
          else if (floorVal !== selectedFloor.value) {
            continue
          }
        }
        if (c.banMeisho) {
          set.add(c.banMeisho)
        }
      }
    }
    else {
      const filtered = selectedBanShubetsu.value === 'ALL'
        ? panelOptions.value
        : panelOptions.value.filter(p => p.banShubetsu === selectedBanShubetsu.value)

      filtered.forEach((p) => {
        if (p.banMeisho) {
          set.add(p.banMeisho)
        }
      })
    }

    const sorted = Array.from(set).sort((a, b) =>
      a.localeCompare(b, 'ja', { numeric: true, sensitivity: 'base' }),
    )

    const list = sorted.map(m => ({ label: m, value: m }))

    return [{ label: 'すべての盤', value: 'ALL' }, ...list]
  })

  // エリア変更等で盤名称が選択肢から外れた場合はALLへリセット
  watch(availableBanMeishoList, (opts) => {
    if (selectedBanMeisho.value !== 'ALL' && !opts.some(o => o.value === selectedBanMeisho.value)) {
      selectedBanMeisho.value = 'ALL'
    }
  })

  // 系統・盤種別・エリア・盤名称でフィルタリングした表示用回路一覧
  const filteredCircuits = computed(() => {
    return circuits.value.filter((c) => {
      // 系統フィルタ (ALL以外の場合)
      if (selectedKeiTo.value && selectedKeiTo.value !== 'ALL' && c.keiTo !== selectedKeiTo.value) {
        return false
      }

      if (selectedBanShubetsu.value !== 'ALL' && c.banShubetsu !== selectedBanShubetsu.value) {
        return false
      }

      if (selectedFloor.value !== 'ALL') {
        const floorVal = (c.floor || '').trim()

        if (selectedFloor.value === '__UNSET__') {
          if (floorVal) return false
        }
        else if (floorVal !== selectedFloor.value) {
          return false
        }
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

  const notifyConflict = feedbackOptions?.onConflict || ((msg: string) => {
    try {
      useToast().warning(msg)
    }
    catch {
      // Ignore in non-Nuxt test context
    }
  })

  const notifyError = feedbackOptions?.onError || ((msg: string) => {
    try {
      useToast().error(msg)
    }
    catch {
      // Ignore in non-Nuxt test context
    }
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
    return getUserDisplayName(currentUser.value)
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

    const previousSnapshot: CircuitItem = { ...circuit }

    isActionLoading.value[circuit.id] = true
    const clientConfirmedAt = getAccurateNow().toISOString()
    const workerName = getWorkerName()

    // 1. 【Local-First】 IndexedDB と UI メモリを即座に更新 (0ms レスポンス)
    const localPatch: Partial<CircuitItem> = {
      ...optimisticPatch,
      ...(actionType === 'confirm' && !payload.remarksOnly ? { clientConfirmedAt, workerName } : {}),
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
      const res = await $api<CircuitActionResponse>(endpoint, {
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
        if (enqueuedRecord) {
          await removeQueueItem(enqueuedRecord.id)
        }

        return
      }

      // オフラインまたはネットワークエラー時はローカル確定で正常終了 (キューに残る)
      if (isNetworkError(err)) {
        return { success: true, isOffline: true }
      }

      // ネットワークエラー以外の 4xx/5xx エラー時は楽観的更新をロールバックし、不正なキュー残留を防止
      updateLocalCircuit(circuit.id, previousSnapshot)
      await CircuitsRepository.put(previousSnapshot)

      if (enqueuedRecord) {
        await removeQueueItem(enqueuedRecord.id)
      }

      const actionName = payload.remarksOnly ? '備考保存' : (actionType === 'confirm' ? '確定' : '確定解除')

      notifyError(`${actionName}に失敗しました: ${getErrorMessage(err)}`)
      throw err
    }
    finally {
      isActionLoading.value[circuit.id] = false
    }
  }

  // --- 除外回路等の備考のみ保存アクション (Phase 1〜3 共通) ---
  const saveExcludedRemarks = async (circuit: CircuitItem, remarks: string) => {
    const trimmedRemarks = remarks.trim()
    const optimisticPatch: Partial<CircuitItem>
      = phaseNumber === 1
        ? { p1Remarks: trimmedRemarks }
        : phaseNumber === 2
          ? { p2Remarks: trimmedRemarks }
          : { p3Remarks: trimmedRemarks }

    return executeCircuitAction(
      circuit,
      'confirm',
      { remarks: trimmedRemarks, remarksOnly: true },
      optimisticPatch,
    )
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
    const finalMashishimeCubicle = overrideData?.mashishimeCubicle !== undefined
      ? Boolean(overrideData.mashishimeCubicle)
      : Boolean(circuit.p1MashishimeCubicle)
    const hasAnyCheck = finalKakunin || finalMashishime || finalMashishimeCubicle

    const payload: ConfirmPhase1Payload = {
      kakunin: finalKakunin,
      mashishime: finalMashishime,
      mashishimeCubicle: finalMashishimeCubicle,
      remarks: overrideData?.remarks ?? circuit.p1Remarks ?? '',
      ...overrideData,
    }

    const nowIso = getAccurateNow().toISOString()
    const workerName = getWorkerName()

    const optimisticPatch: Partial<CircuitItem> = {
      p1Kakunin: finalKakunin,
      p1Mashishime: finalMashishime,
      p1MashishimeCubicle: finalMashishimeCubicle,
      p1Remarks: String(payload.remarks || ''),
      p1ConfirmedAt: hasAnyCheck ? nowIso : null,
      p1Worker: hasAnyCheck ? workerName : null,
    }

    return executeCircuitAction(circuit, 'confirm', payload, optimisticPatch)
  }

  // --- Phase 2 専用アクション ---
  const confirmPhase2 = async (
    circuit: CircuitItem,
    payload: ConfirmPhase2Payload,
  ) => {
    const nowIso = getAccurateNow().toISOString()
    const workerName = getWorkerName()

    const optimisticPatch: Partial<CircuitItem> = {
      zetsuenR: payload.rVal !== undefined ? payload.rVal : circuit.zetsuenR,
      zetsuenS: payload.sVal !== undefined ? payload.sVal : circuit.zetsuenS,
      zetsuenT: payload.tVal !== undefined ? payload.tVal : circuit.zetsuenT,
      p2RStatus: payload.rStatus !== undefined ? payload.rStatus : circuit.p2RStatus,
      p2SStatus: payload.sStatus !== undefined ? payload.sStatus : circuit.p2SStatus,
      p2TStatus: payload.tStatus !== undefined ? payload.tStatus : circuit.p2TStatus,
      p2Remarks: payload.remarks !== undefined ? payload.remarks : circuit.p2Remarks,
      p2IsComplete: payload.isComplete !== undefined ? payload.isComplete : true,
      p2ConfirmedAt: nowIso,
      p2Worker: workerName,
    }

    return executeCircuitAction(circuit, 'confirm', payload as Record<string, unknown>, optimisticPatch)
  }

  // --- Phase 3 専用アクション ---
  const confirmPhase3 = async (
    circuit: CircuitItem,
    payload: ConfirmPhase3Payload,
  ) => {
    const nowIso = getAccurateNow().toISOString()
    const workerName = getWorkerName()

    const optimisticPatch: Partial<CircuitItem> = {
      denatsuRs: payload.rs !== undefined ? payload.rs : circuit.denatsuRs,
      denatsuSt: payload.st !== undefined ? payload.st : circuit.denatsuSt,
      denatsuRt: payload.rt !== undefined ? payload.rt : circuit.denatsuRt,
      kensou: payload.kensou !== undefined ? payload.kensou : circuit.kensou,
      p3Remarks: payload.remarks !== undefined ? payload.remarks : circuit.p3Remarks,
      p3IsComplete: payload.isComplete !== undefined ? payload.isComplete : true,
      p3ConfirmedAt: nowIso,
      p3Worker: workerName,
    }

    return executeCircuitAction(circuit, 'confirm', payload as Record<string, unknown>, optimisticPatch)
  }

  return {
    circuits,
    isLoading,
    isActionLoading,
    selectedKeiTo,
    selectedBanShubetsu,
    selectedFloor,
    selectedBanMeisho,
    shubetsuTabOptions,
    availableFloorList,
    availableBanMeishoList,
    filteredCircuits,
    phaseStats,
    fetchCircuits,
    isThreePhase,
    saveExcludedRemarks,
    confirmPhase1,
    confirmPhase2,
    confirmPhase3,
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
