import type { Ref } from 'vue'
import { ref, unref } from 'vue'

import { usePhaseExamBase } from '~/composables/portal/phase/usePhaseExamBase'
import type { CircuitItem } from '~/types/souden'

/**
 * フェーズ1：回路確認・増し締め試験専用 Composable
 */
export function usePhase1Exam(
  siteIdRef: Ref<string> | string,
  initialKeiTo: string = '幹線',
) {
  const base = usePhaseExamBase(siteIdRef, initialKeiTo, 1)
  const {
    circuits,
    isActionLoading,
    handleConflictError,
    isNetworkError,
    enqueue,
    getAccurateNow,
    getWorkerName,
  } = base

  const editingRowId = ref<string | null>(null)
  const editForm = ref<Record<string, string>>({})

  // 行の編集開始
  const startEdit = (row: CircuitItem) => {
    editingRowId.value = row.id
    editForm.value = {
      kairoBangou: row.kairoBangou || '',
      kairoMeisho: row.kairoMeisho || '',
      cableList: row.cableList || '',
      haisenJousuu: row.haisenJousuu || '',
      setsuchiList: row.setsuchiList || '',
      remarks: row.p1Remarks || '',
    }
  }

  // 行の編集キャンセル
  const cancelEdit = () => {
    editingRowId.value = null
    editForm.value = {}
  }

  // Phase 1 確定実行
  const confirmPhase1 = async (
    circuit: CircuitItem,
    overrideData?: {
      kakunin?: boolean
      mashishime?: boolean
      remarks?: string
      modifiedFields?: string[]
      [key: string]: unknown
    },
  ) => {
    const siteId = unref(siteIdRef)

    if (!siteId) return

    isActionLoading.value[circuit.id] = true

    const clientConfirmedAt = getAccurateNow().toISOString()
    const workerName = getWorkerName()

    const payload = {
      kakunin: overrideData?.kakunin ?? circuit.p1Kakunin ?? true,
      mashishime: overrideData?.mashishime ?? circuit.p1Mashishime ?? true,
      remarks: overrideData?.remarks ?? circuit.p1Remarks ?? '',
      modifiedFields: overrideData?.modifiedFields ?? [],
      expectedUpdatedAt: circuit.updatedAt,
      expectedVersion: circuit.version,
      ...overrideData,
    }

    try {
      const res = await $fetch<{ success: boolean, circuit: CircuitItem }>(
        `/api/sites/${siteId}/circuits/${circuit.id}/phase1`,
        {
          method: 'POST',
          body: {
            ...payload,
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

      cancelEdit()

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
          phase: 1,
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
            p1Kakunin: Boolean(payload.kakunin),
            p1Mashishime: Boolean(payload.mashishime),
            p1Remarks: String(payload.remarks || ''),
            p1Worker: workerName,
            p1ConfirmedAt: clientConfirmedAt,
          }
        }

        cancelEdit()

        return { success: true, isOffline: true }
      }

      const e = err as Error

      alert(`確定に失敗しました: ${e.message}`)
      throw err
    }
    finally {
      isActionLoading.value[circuit.id] = false
    }
  }

  // Phase 1 確定解除
  const clearPhase1 = async (circuit: CircuitItem) => {
    const siteId = unref(siteIdRef)

    if (!siteId) return

    if (!confirm(`盤「${circuit.banMeisho}」回路「${circuit.kairoBangou || circuit.kairoMeisho}」のフェーズ1確定を解除しますか？`)) {
      return
    }

    isActionLoading.value[circuit.id] = true

    const clientConfirmedAt = getAccurateNow().toISOString()

    try {
      const res = await $fetch<{ success: boolean, circuit: CircuitItem }>(
        `/api/sites/${siteId}/circuits/${circuit.id}/phase1/clear`,
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
          phase: 1,
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
            p1Kakunin: false,
            p1Mashishime: false,
            p1Worker: null,
            p1ConfirmedAt: null,
          }
        }

        return { success: true, isOffline: true }
      }

      const e = err as Error

      alert(`確定解除に失敗しました: ${e.message}`)
      throw err
    }
    finally {
      isActionLoading.value[circuit.id] = false
    }
  }

  // インライン編集の保存
  const saveEdit = async (circuit: CircuitItem, formPayload?: Record<string, string>) => {
    const form = formPayload || editForm.value
    const modifiedFields: string[] = []

    const checkMod = (key: keyof CircuitItem, formKey: string) => {
      const oldVal = (circuit[key] || '') as string
      const newVal = (form[formKey] || '') as string

      if (oldVal !== newVal) {
        modifiedFields.push(String(key))
      }
    }

    checkMod('kairoBangou', 'kairoBangou')
    checkMod('kairoMeisho', 'kairoMeisho')
    checkMod('cableList', 'cableList')
    checkMod('haisenJousuu', 'haisenJousuu')
    checkMod('setsuchiList', 'setsuchiList')

    if ((circuit.p1Remarks || '') !== (form.remarks || '')) {
      modifiedFields.push('p1Remarks')
    }

    await confirmPhase1(circuit, {
      ...form,
      modifiedFields,
    })
  }

  return {
    ...base,
    editingRowId,
    editForm,
    startEdit,
    cancelEdit,
    saveEdit,
    confirmPhase1,
    clearPhase1,
  }
}
