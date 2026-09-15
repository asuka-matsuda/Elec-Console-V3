import type { Ref } from 'vue'
import { ref, unref } from 'vue'

import { usePhaseExamBase } from '~/composables/portal/phase/usePhaseExamBase'
import type { CircuitItem } from '~/types/souden'

/**
 * フェーズ3：送電・電圧測定・検相試験専用 Composable
 */
export function usePhase3Exam(
  siteIdRef: Ref<string> | string,
  initialKeiTo: string = '幹線',
) {
  const base = usePhaseExamBase(siteIdRef, initialKeiTo, 3)
  const {
    circuits,
    filteredCircuits,
    isCircuitLocked,
    isActionLoading,
    isThreePhase,
    handleConflictError,
    isNetworkError,
    enqueue,
    getAccurateNow,
    getWorkerName,
  } = base

  const isBatchLoading = ref(false)

  // Phase 3 確定実行
  const confirmPhase3 = async (
    circuit: CircuitItem,
    payload: {
      rs?: number | null
      st?: number | null
      rt?: number | null
      kensou?: string | null
      remarks?: string
    },
  ) => {
    const siteId = unref(siteIdRef)

    if (!siteId) return

    isActionLoading.value[circuit.id] = true

    const clientConfirmedAt = getAccurateNow().toISOString()
    const workerName = getWorkerName()

    try {
      const res = await $fetch<{ success: boolean, circuit: CircuitItem }>(
        `/api/sites/${siteId}/circuits/${circuit.id}/phase3`,
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
          phase: 3,
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
            denatsuRs: payload.rs !== undefined ? payload.rs : target.denatsuRs,
            denatsuSt: payload.st !== undefined ? payload.st : target.denatsuSt,
            denatsuRt: payload.rt !== undefined ? payload.rt : target.denatsuRt,
            kensou: payload.kensou !== undefined ? payload.kensou : target.kensou,
            p3Remarks: payload.remarks !== undefined ? payload.remarks : target.p3Remarks,
            p3Worker: workerName,
            p3ConfirmedAt: clientConfirmedAt,
          }
        }

        return { success: true, isOffline: true }
      }

      const e = err as Error

      alert(`フェーズ3の確定に失敗しました: ${e.message}`)
      throw err
    }
    finally {
      isActionLoading.value[circuit.id] = false
    }
  }

  // Phase 3 確定解除
  const clearPhase3 = async (circuit: CircuitItem) => {
    const siteId = unref(siteIdRef)

    if (!siteId) return

    if (!confirm(`盤「${circuit.banMeisho}」回路「${circuit.kairoBangou || circuit.kairoMeisho}」のフェーズ3確定を解除しますか？`)) {
      return
    }

    isActionLoading.value[circuit.id] = true

    const clientConfirmedAt = getAccurateNow().toISOString()

    try {
      const res = await $fetch<{ success: boolean, circuit: CircuitItem }>(
        `/api/sites/${siteId}/circuits/${circuit.id}/phase3/clear`,
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
          phase: 3,
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
            denatsuRs: null,
            denatsuSt: null,
            denatsuRt: null,
            kensou: null,
            p3Worker: null,
            p3ConfirmedAt: null,
          }
        }

        return { success: true, isOffline: true }
      }

      const e = err as Error

      alert(`フェーズ3の解除に失敗しました: ${e.message}`)
      throw err
    }
    finally {
      isActionLoading.value[circuit.id] = false
    }
  }

  // Phase 3 一括確定（現在絞り込み中の未完了・非除外・非ロック回路）
  const batchConfirmPhase3 = async () => {
    const targets = filteredCircuits.value.filter(
      c => !c.isExcluded && !isCircuitLocked(c) && !c.p3ConfirmedAt,
    )

    if (targets.length === 0) {
      alert('一括確定の対象となる未完了回路がありません')

      return
    }

    if (!confirm(`表示中の未完了回路（${targets.length}件）を一括で標準電圧・正常検相として確定しますか？`)) {
      return
    }

    isBatchLoading.value = true

    try {
      for (const circuit of targets) {
        const three = isThreePhase(circuit)

        if (three) {
          await confirmPhase3(circuit, {
            rs: 210,
            st: 210,
            rt: 210,
            kensou: '正相',
          })
        }
        else {
          await confirmPhase3(circuit, {
            rs: 105,
            st: 105,
            rt: 210,
            kensou: '点灯確認(良)',
          })
        }
      }
    }
    finally {
      isBatchLoading.value = false
    }
  }

  return {
    ...base,
    isBatchLoading,
    confirmPhase3,
    clearPhase3,
    batchConfirmPhase3,
  }
}
