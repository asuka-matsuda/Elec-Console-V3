/**
 * 送電試験（Phase 1〜3）共通ユーティリティ（再エクスポート）
 *
 * @description 単相/三相の相名称計算、数値パース、測定値フォーマッタ、標準値定義を
 * クライアント・サーバー共有ロジック（#shared/utils/soudenExam）から再エクスポートします。
 */

import type { CircuitItem } from '#shared/types/circuit'

export * from '../../shared/utils/soudenExam'

export interface SoudenRowClassOptions {
  isComplete?: (circuit: CircuitItem) => boolean
  isCircuitLocked?: (circuit: CircuitItem) => boolean
  editingRowId?: string | null
}

export function getSoudenRowClass(circuit: CircuitItem, options?: SoudenRowClassOptions) {
  return {
    'is-completed': options?.isComplete?.(circuit) ?? false,
    'is-excluded': circuit.isExcluded,
    'is-locked': options?.isCircuitLocked?.(circuit) ?? false,
    'is-highlighted': options?.editingRowId === circuit.id,
  }
}

export function getWorkerCellData(circuit: CircuitItem, key: string) {
  const prefix = key.replace('ConfirmedAt', '') // 'p1' | 'p2' | 'p3'
  const worker = circuit[`${prefix}Worker` as keyof CircuitItem] as string | null | undefined
  const confirmedAt = circuit[key as keyof CircuitItem] as string | null | undefined

  return { worker, confirmedAt }
}
