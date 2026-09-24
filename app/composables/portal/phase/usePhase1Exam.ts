/**
 * フェーズ1（回路確認・増締試験）Composable
 *
 * @description 回路情報の編集・保存、フェーズ1の確定および解除アクションを提供します。
 */

import type { Ref } from 'vue'
import { ref } from 'vue'

import { usePhaseExamBase } from '~/composables/portal/phase/usePhaseExamBase'
import { useAuth } from '~/composables/useAuth'
import type { CircuitItem } from '~/types/souden'

/**
 * フェーズ1：回路確認・増締試験専用 Composable
 */
export function usePhase1Exam(
  siteIdRef: Ref<string> | string,
  initialKeiTo: string = '幹線',
) {
  const { currentUser } = useAuth()
  const base = usePhaseExamBase(siteIdRef, initialKeiTo, 1)
  const { executeCircuitAction } = base

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

  const getWorkerDisplayName = () => {
    if (!currentUser.value) return '作業者'

    return `${currentUser.value.lastName || ''} ${currentUser.value.firstName || ''}`.trim() || currentUser.value.loginId || '作業者'
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
    const finalKakunin = overrideData?.kakunin !== undefined
      ? Boolean(overrideData.kakunin)
      : (circuit.p1Kakunin ?? true)
    const finalMashishime = overrideData?.mashishime !== undefined
      ? Boolean(overrideData.mashishime)
      : (circuit.p1Mashishime ?? true)
    const isP1Complete = finalKakunin && finalMashishime
    const hasAnyCheck = finalKakunin || finalMashishime

    const payload = {
      kakunin: finalKakunin,
      mashishime: finalMashishime,
      remarks: overrideData?.remarks ?? circuit.p1Remarks ?? '',
      modifiedFields: overrideData?.modifiedFields ?? [],
      ...overrideData,
    }

    const nowIso = new Date().toISOString()
    const workerName = getWorkerDisplayName()

    const optimisticPatch: Partial<CircuitItem> = {
      p1Kakunin: finalKakunin,
      p1Mashishime: finalMashishime,
      p1Remarks: String(payload.remarks || ''),
      p1ConfirmedAt: isP1Complete ? (circuit.p1ConfirmedAt || nowIso) : null,
      p1Worker: hasAnyCheck ? (circuit.p1Worker || workerName) : null,
    }

    const res = await executeCircuitAction(circuit, 'confirm', payload, optimisticPatch)

    cancelEdit()

    return res
  }

  // チェックボックス単体トグル（サイズ確認 / 増締）
  const updateCheck = async (
    circuit: CircuitItem,
    changes: { kakunin?: boolean, mashishime?: boolean },
  ) => {
    const newKakunin = changes.kakunin !== undefined ? Boolean(changes.kakunin) : Boolean(circuit.p1Kakunin)
    const newMashishime = changes.mashishime !== undefined ? Boolean(changes.mashishime) : Boolean(circuit.p1Mashishime)
    const isP1Complete = newKakunin && newMashishime
    const hasAnyCheck = newKakunin || newMashishime
    const nowIso = new Date().toISOString()
    const workerName = getWorkerDisplayName()

    const optimisticPatch: Partial<CircuitItem> = {
      p1Kakunin: newKakunin,
      p1Mashishime: newMashishime,
      p1ConfirmedAt: isP1Complete ? (circuit.p1ConfirmedAt || nowIso) : null,
      p1Worker: hasAnyCheck ? (circuit.p1Worker || workerName) : null,
    }

    return executeCircuitAction(
      circuit,
      'confirm',
      {
        kakunin: newKakunin,
        mashishime: newMashishime,
        remarks: circuit.p1Remarks || '',
      },
      optimisticPatch,
    )
  }

  // Phase 1 確定解除
  const clearPhase1 = async (circuit: CircuitItem) => {
    if (!confirm(`盤「${circuit.banMeisho}」回路「${circuit.kairoBangou || circuit.kairoMeisho}」のフェーズ1確定を解除しますか？`)) {
      return
    }

    const optimisticPatch: Partial<CircuitItem> = {
      p1Kakunin: false,
      p1Mashishime: false,
      p1Worker: null,
      p1ConfirmedAt: null,
    }

    return executeCircuitAction(circuit, 'clear', {}, optimisticPatch)
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
    updateCheck,
  }
}
