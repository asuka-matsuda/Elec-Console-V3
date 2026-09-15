import type { Ref } from 'vue'
import { ref, unref } from 'vue'

import { usePhaseExamBase } from '~/composables/portal/phase/usePhaseExamBase'
import type { CircuitItem } from '~/types/souden'

/**
 * フェーズ2：絶縁抵抗測定（メガ測定）試験専用 Composable
 */
export function usePhase2Exam(
  siteIdRef: Ref<string> | string,
  initialKeiTo: string = '幹線',
) {
  const base = usePhaseExamBase(siteIdRef, initialKeiTo, 2)
  const {
    circuits,
    filteredCircuits,
    phase2ThresholdMegOhm,
    isCircuitLocked,
    isActionLoading,
    handleConflictError,
    isNetworkError,
    enqueue,
    getAccurateNow,
    getWorkerName,
  } = base

  const isBatchLoading = ref(false)

  // 測定値に基づくOK/NG判定
  const evalMegStatus = (val: number | string | null | undefined): 'OK' | 'NG' | null => {
    if (val === null || val === undefined || val === '') return null
    const num = typeof val === 'number' ? val : parseFloat(String(val))

    if (isNaN(num)) return null

    return num >= phase2ThresholdMegOhm.value ? 'OK' : 'NG'
  }

  // Phase 2 確定実行
  const confirmPhase2 = async (
    circuit: CircuitItem,
    payload: {
      rVal?: number | null
      sVal?: number | null
      tVal?: number | null
      rStatus?: string | null
      sStatus?: string | null
      tStatus?: string | null
      remarks?: string
      isComplete?: boolean
    },
  ) => {
    const siteId = unref(siteIdRef)

    if (!siteId) return

    isActionLoading.value[circuit.id] = true

    const clientConfirmedAt = getAccurateNow().toISOString()
    const workerName = getWorkerName()

    try {
      const res = await $fetch<{ success: boolean, circuit: CircuitItem }>(
        `/api/sites/${siteId}/circuits/${circuit.id}/phase2`,
        {
          method: 'POST',
          body: {
            ...payload,
            clientConfirmedAt,
            expectedUpdatedAt: circuit.updatedAt,
            expectedVersion: circuit.version,
          },
        },
      )

      if (res.circuit) {
        const idx = circuits.value.findIndex(c => c.id === circuit.id)

        if (idx !== -1) {
          circuits.value[idx] = {
            ...circuits.value[idx],
            ...res.circuit,
          }
        }
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
          phase: 2,
          actionType: 'confirm',
          payload,
          clientConfirmedAt,
          expectedUpdatedAt: circuit.updatedAt,
          expectedVersion: circuit.version,
          workerName,
        })

        const idx = circuits.value.findIndex(c => c.id === circuit.id)
        const target = circuits.value[idx]

        if (idx !== -1 && target) {
          circuits.value[idx] = {
            ...target,
            zetsuenR: payload.rVal !== undefined ? payload.rVal : target.zetsuenR,
            zetsuenS: payload.sVal !== undefined ? payload.sVal : target.zetsuenS,
            zetsuenT: payload.tVal !== undefined ? payload.tVal : target.zetsuenT,
            p2RStatus: payload.rStatus !== undefined ? payload.rStatus : target.p2RStatus,
            p2SStatus: payload.sStatus !== undefined ? payload.sStatus : target.p2SStatus,
            p2TStatus: payload.tStatus !== undefined ? payload.tStatus : target.p2TStatus,
            p2Remarks: payload.remarks !== undefined ? payload.remarks : target.p2Remarks,
            p2Worker: workerName,
            p2IsComplete: payload.isComplete !== undefined ? payload.isComplete : true,
            p2ConfirmedAt: clientConfirmedAt,
          }
        }

        return { success: true, isOffline: true }
      }

      const e = err as Error

      alert(`フェーズ2の確定に失敗しました: ${e.message}`)
      throw err
    }
    finally {
      isActionLoading.value[circuit.id] = false
    }
  }

  // Phase 2 確定解除
  const clearPhase2 = async (circuit: CircuitItem) => {
    const siteId = unref(siteIdRef)

    if (!siteId) return

    if (!confirm(`盤「${circuit.banMeisho}」回路「${circuit.kairoBangou || circuit.kairoMeisho}」のフェーズ2確定を解除しますか？`)) {
      return
    }

    isActionLoading.value[circuit.id] = true

    const clientConfirmedAt = getAccurateNow().toISOString()

    try {
      const res = await $fetch<{ success: boolean, circuit: CircuitItem }>(
        `/api/sites/${siteId}/circuits/${circuit.id}/phase2/clear`,
        {
          method: 'POST',
          body: {
            expectedUpdatedAt: circuit.updatedAt,
            expectedVersion: circuit.version,
            clientConfirmedAt,
          },
        },
      )

      if (res.circuit) {
        const idx = circuits.value.findIndex(c => c.id === circuit.id)

        if (idx !== -1) {
          circuits.value[idx] = {
            ...circuits.value[idx],
            ...res.circuit,
          }
        }
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
          phase: 2,
          actionType: 'clear',
          payload: {},
          clientConfirmedAt,
          expectedUpdatedAt: circuit.updatedAt,
          expectedVersion: circuit.version,
        })

        const idx = circuits.value.findIndex(c => c.id === circuit.id)
        const target = circuits.value[idx]

        if (idx !== -1 && target) {
          circuits.value[idx] = {
            ...target,
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
        }

        return { success: true, isOffline: true }
      }

      const e = err as Error

      alert(`フェーズ2の解除に失敗しました: ${e.message}`)
      throw err
    }
    finally {
      isActionLoading.value[circuit.id] = false
    }
  }

  // Phase 2 一括OK確定（現在絞り込み中の未完了・非除外・非ロック回路）
  const batchConfirmPhase2 = async (defaultMegValue: number = 100) => {
    const targets = filteredCircuits.value.filter(
      c => !c.isExcluded && !isCircuitLocked(c) && (!c.p2ConfirmedAt || !c.p2IsComplete),
    )

    if (targets.length === 0) {
      alert('一括確定の対象となる未完了回路がありません')

      return
    }

    if (!confirm(`表示中の未完了回路（${targets.length}件）を一括で ${defaultMegValue}MΩ (OK) として確定しますか？`)) {
      return
    }

    isBatchLoading.value = true

    try {
      for (const circuit of targets) {
        await confirmPhase2(circuit, {
          rVal: defaultMegValue,
          sVal: defaultMegValue,
          tVal: defaultMegValue,
          rStatus: 'OK',
          sStatus: 'OK',
          tStatus: 'OK',
          isComplete: true,
        })
      }
    }
    finally {
      isBatchLoading.value = false
    }
  }

  return {
    ...base,
    isBatchLoading,
    evalMegStatus,
    confirmPhase2,
    clearPhase2,
    batchConfirmPhase2,
  }
}
