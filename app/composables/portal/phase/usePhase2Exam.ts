import type { Ref } from 'vue'

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
    filteredCircuits,
    phase2ThresholdMegOhm,
    isCircuitLocked,
    executeCircuitAction,
    executeBatchConfirm,
  } = base

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

    return executeCircuitAction(circuit, 'confirm', payload, optimisticPatch)
  }

  // Phase 2 確定解除
  const clearPhase2 = async (circuit: CircuitItem) => {
    if (!confirm(`盤「${circuit.banMeisho}」回路「${circuit.kairoBangou || circuit.kairoMeisho}」のフェーズ2確定を解除しますか？`)) {
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

  // Phase 2 一括OK確定（現在絞り込み中の未完了・非除外・非ロック回路）
  const batchConfirmPhase2 = async (defaultMegValue: number = 100) => {
    const targets = filteredCircuits.value.filter(
      c => !c.isExcluded && !isCircuitLocked(c) && (!c.p2ConfirmedAt || !c.p2IsComplete),
    )

    await executeBatchConfirm(
      targets,
      `表示中の未完了回路（${targets.length}件）を一括で ${defaultMegValue}MΩ (OK) として確定しますか？`,
      circuit => confirmPhase2(circuit, {
        rVal: defaultMegValue,
        sVal: defaultMegValue,
        tVal: defaultMegValue,
        rStatus: 'OK',
        sStatus: 'OK',
        tStatus: 'OK',
        isComplete: true,
      }),
    )
  }

  return {
    ...base,
    evalMegStatus,
    confirmPhase2,
    clearPhase2,
    batchConfirmPhase2,
  }
}
