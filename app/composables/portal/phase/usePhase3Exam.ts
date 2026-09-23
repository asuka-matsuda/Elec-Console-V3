/**
 * フェーズ3（送電・電圧測定・検相試験）Composable
 *
 * @description 電圧測定値・検相結果の入力、一括確定、フェーズ3の確定および解除を提供します。
 */

import type { Ref } from 'vue'

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
    filteredCircuits,
    isCircuitLocked,
    isThreePhase,
    executeCircuitAction,
    executeBatchConfirm,
  } = base

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
    const optimisticPatch: Partial<CircuitItem> = {
      denatsuRs: payload.rs !== undefined ? payload.rs : circuit.denatsuRs,
      denatsuSt: payload.st !== undefined ? payload.st : circuit.denatsuSt,
      denatsuRt: payload.rt !== undefined ? payload.rt : circuit.denatsuRt,
      kensou: payload.kensou !== undefined ? payload.kensou : circuit.kensou,
      p3Remarks: payload.remarks !== undefined ? payload.remarks : circuit.p3Remarks,
    }

    return executeCircuitAction(circuit, 'confirm', payload, optimisticPatch)
  }

  // Phase 3 確定解除
  const clearPhase3 = async (circuit: CircuitItem) => {
    if (!confirm(`盤「${circuit.banMeisho}」回路「${circuit.kairoBangou || circuit.kairoMeisho}」のフェーズ3確定を解除しますか？`)) {
      return
    }

    const optimisticPatch: Partial<CircuitItem> = {
      denatsuRs: null,
      denatsuSt: null,
      denatsuRt: null,
      kensou: null,
      p3Worker: null,
      p3ConfirmedAt: null,
    }

    return executeCircuitAction(circuit, 'clear', {}, optimisticPatch)
  }

  // Phase 3 一括確定（現在絞り込み中の未完了・非除外・非ロック回路）
  const batchConfirmPhase3 = async () => {
    const targets = filteredCircuits.value.filter(
      c => !c.isExcluded && !isCircuitLocked(c) && !c.p3ConfirmedAt,
    )

    await executeBatchConfirm(
      targets,
      `表示中の未完了回路（${targets.length}件）を一括で標準電圧・正常検相として確定しますか？`,
      (circuit) => {
        const three = isThreePhase(circuit)

        if (three) {
          return confirmPhase3(circuit, {
            rs: 210,
            st: 210,
            rt: 210,
            kensou: '正相',
          })
        }
        else {
          return confirmPhase3(circuit, {
            rs: 105,
            st: 105,
            rt: 210,
            kensou: '点灯確認(良)',
          })
        }
      },
    )
  }

  return {
    ...base,
    confirmPhase3,
    clearPhase3,
    batchConfirmPhase3,
  }
}
