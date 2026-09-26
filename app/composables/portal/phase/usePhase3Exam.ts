/**
 * フェーズ3（送電・電圧測定・検相試験）Composable
 *
 * @description 電圧測定値・検相結果の入力、一括確定、フェーズ3の確定および解除を提供します。
 */

import type { Ref } from 'vue'

import type { CircuitItem } from '#shared/types/circuit'
import type { PhaseExamFeedbackOptions } from '~/composables/portal/phase/usePhaseExamBase'
import { usePhaseExamBase } from '~/composables/portal/phase/usePhaseExamBase'

/**
 * フェーズ3：送電・電圧測定・検相試験専用 Composable
 */
export function usePhase3Exam(
  siteIdRef: Ref<string> | string,
  initialKeiTo: string = '幹線',
  feedbackOptions?: PhaseExamFeedbackOptions,
) {
  const base = usePhaseExamBase(siteIdRef, initialKeiTo, 3, feedbackOptions)
  const {
    executeCircuitAction,
    askConfirmClear,
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
      isComplete?: boolean
    },
  ) => {
    const optimisticPatch: Partial<CircuitItem> = {
      denatsuRs: payload.rs !== undefined ? payload.rs : circuit.denatsuRs,
      denatsuSt: payload.st !== undefined ? payload.st : circuit.denatsuSt,
      denatsuRt: payload.rt !== undefined ? payload.rt : circuit.denatsuRt,
      kensou: payload.kensou !== undefined ? payload.kensou : circuit.kensou,
      p3Remarks: payload.remarks !== undefined ? payload.remarks : circuit.p3Remarks,
      p3IsComplete: payload.isComplete !== undefined ? payload.isComplete : true,
    }

    return executeCircuitAction(circuit, 'confirm', payload, optimisticPatch)
  }

  // Phase 3 確定解除
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
    ...base,
    confirmPhase3,
    clearPhase3,
  }
}
