/**
 * 送電試験（Phase 1〜3）基底共通 Composable
 *
 * @description 回路一覧の取得、楽観ロック制御、更新アクション実行の共通基盤を提供します。
 */

import type { Ref } from 'vue'
import { computed, ref, unref, watch } from 'vue'

import type { CircuitItem, CircuitsResponse, PanelOption } from '#shared/types/circuit'
import { isPhaseComplete } from '#shared/utils/soudenExam'
import { useOfflineSync } from '~/composables/portal/useOfflineSync'
import { useApi } from '~/composables/useApi'
import { useAuth } from '~/composables/useAuth'
import { AppException } from '~/utils/errors'

export interface PhaseExamFeedbackOptions {
  onConflict?: (message: string) => void
  onError?: (message: string) => void
  onConfirmClear?: (message: string) => boolean | Promise<boolean>
}

/**
 * 送電試験（Phase 1〜3）の基底共通Composable
 * 回路データの取得、盤フィルタリング、排他制御エラーハンドリング、オフライン同期連携、
 * 幹線ロック判定、および進捗統計の算出を担当します。
 */
export function usePhaseExamBase(
  siteIdRef: Ref<string> | string,
  initialKeiTo: string = '幹線',
  phaseNumber: number = 1,
  feedbackOptions?: PhaseExamFeedbackOptions,
) {
  const { getAccurateNow, currentUser } = useAuth()
  const { enqueue } = useOfflineSync(siteIdRef)
  const { $api } = useApi()

  const circuits = ref<CircuitItem[]>([])
  const panelOptions = ref<PanelOption[]>([])
  const panelsWithIncompleteKansen = ref<string[]>([])
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

    const e = err as { name?: string, message?: string, statusCode?: number }

    if (e?.name === 'TypeError' && (e?.message?.includes('fetch') || e?.message?.includes('Network'))) {
      return true
    }

    if (e?.name === 'FetchError' && !e?.statusCode) {
      return true
    }

    return false
  }

  // 回路一覧データの取得
  const fetchCircuits = async () => {
    const siteId = unref(siteIdRef)

    if (!siteId) return

    isLoading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()

      if (selectedKeiTo.value && selectedKeiTo.value !== 'ALL') {
        params.append('keiTo', selectedKeiTo.value)
      }

      const res = await $api<CircuitsResponse>(
        `/api/sites/${siteId}/circuits?${params.toString()}`,
      )

      if (res) {
        circuits.value = res.circuits || []
        panelOptions.value = res.panelOptions || []
        panelsWithIncompleteKansen.value = res.panelsWithIncompleteKansen || []
        if (typeof res.phase2ThresholdMegOhm === 'number') {
          phase2ThresholdMegOhm.value = res.phase2ThresholdMegOhm
        }
      }
    }
    catch (err: unknown) {
      const e = err as Error

      error.value = e.message || '通信エラーが発生しました'
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

  // 系統切替時に盤種別・盤名称をALLへリセットし、データを再取得
  watch(selectedKeiTo, () => {
    selectedBanShubetsu.value = 'ALL'
    selectedBanMeisho.value = 'ALL'
    fetchCircuits()
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

  // クライアント側での盤フィルタ適用後の回路一覧
  const filteredCircuits = computed(() => {
    return circuits.value.filter((c) => {
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

  // 該当する二次側回路が操作不可（幹線未完了）かどうか
  const isCircuitLocked = (circuit: CircuitItem): boolean => {
    return circuit.keiTo === '二次側' && panelsWithIncompleteKansen.value.includes(circuit.banMeisho)
  }

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
  const handleConflictError = (circuitId: string, err: unknown): boolean => {
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
        const idx = circuits.value.findIndex(c => c.id === circuitId)

        if (idx !== -1) {
          circuits.value[idx] = {
            ...circuits.value[idx],
            ...current,
          }
        }
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

  // 回路アクション（Phase 1〜3 確定・解除）の共通実行パイプライン
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
      }

      return res
    }
    catch (err: unknown) {
      if (handleConflictError(circuit.id, err)) {
        return
      }

      if (isNetworkError(err)) {
        enqueue({
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

        updateLocalCircuit(circuit.id, {
          ...optimisticPatch,
          ...(actionType === 'confirm' ? { clientConfirmedAt, workerName } : {}),
        })

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
  }
}
