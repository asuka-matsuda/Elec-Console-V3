/**
 * フェーズ1（回路確認・増締試験）Composable
 *
 * @description フェーズ1（サイズ確認・増締）の確定処理を提供します。
 */

import type { Ref } from 'vue'

import { usePhaseExamBase } from '~/composables/portal/phase/usePhaseExamBase'
import type { CircuitItem } from '~/types/souden'

export interface ConfirmPhase1Payload {
  kakunin?: boolean
  mashishime?: boolean
  remarks?: string
  [key: string]: unknown
}

/**
 * フェーズ1：回路確認・増締試験専用 Composable
 */
export function usePhase1Exam(
  siteIdRef: Ref<string> | string,
  initialKeiTo: string = '幹線',
) {
  const base = usePhaseExamBase(siteIdRef, initialKeiTo, 1)
  const { executeCircuitAction, getWorkerName, getAccurateNow } = base

  /**
   * Phase 1 確定実行
   * チェックボックス（確認・増締）の確定値および備考をサーバーへ送信
   */
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

  return {
    ...base,
    confirmPhase1,
  }
}
