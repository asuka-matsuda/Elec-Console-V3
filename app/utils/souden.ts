/**
 * 送電試験（Phase 1〜3）共通ユーティリティ関数
 *
 * @description 単相/三相の相名称計算、数値パース、測定値フォーマッタ、標準値定義を提供します。
 */

import type { CircuitItem } from '~/types/souden'

export interface VoltageToleranceRange {
  target: number
  min: number
  max: number
}

/**
 * フェーズ1（回路確認・増締）が完了しているかを判定します。
 */
export function isPhase1Complete(c: Partial<CircuitItem>): boolean {
  return Boolean(c.p1ConfirmedAt && c.p1Kakunin && c.p1Mashishime)
}

/**
 * フェーズ2（絶縁抵抗測定）が完了しているかを判定します。
 */
export function isPhase2Complete(c: Partial<CircuitItem>): boolean {
  return Boolean(c.p2ConfirmedAt && c.p2IsComplete)
}

/**
 * フェーズ3（送電・電圧測定・検相）が完了しているかを判定します。
 */
export function isPhase3Complete(c: Partial<CircuitItem>): boolean {
  return Boolean(c.p3ConfirmedAt && c.p3IsComplete)
}

/**
 * 指定フェーズ（1〜3）が完了しているかを判定します。
 */
export function isPhaseComplete(c: Partial<CircuitItem>, phase: number): boolean {
  if (phase === 1) return isPhase1Complete(c)
  if (phase === 2) return isPhase2Complete(c)
  if (phase === 3) return isPhase3Complete(c)

  return false
}

/**
 * 回路が三相かどうかに応じた相ラベル（表示名）を取得します。
 * - 三相: R-S / S-T / R-T
 * - 単相: R-N / T-N / R-T
 */
export function getCircuitPhaseLabels(isThreePhase: boolean) {
  if (isThreePhase) {
    return {
      phase1: 'R - S',
      phase2: 'S - T',
      phase3: 'R - T',
    }
  }

  return {
    phase1: 'R - N',
    phase2: 'T - N',
    phase3: 'R - T',
  }
}

/**
 * 入力値を安全に数値または null に変換します。
 */
export function parseNullableNumber(val: string | number | null | undefined): number | null {
  if (val === '' || val == null) return null
  const num = typeof val === 'number' ? val : Number(val)

  return Number.isNaN(num) ? null : num
}

/**
 * フェーズ3（電圧測定・検相）の標準規定値を取得します。
 */
export function getPhase3StandardValues(isThreePhase: boolean) {
  if (isThreePhase) {
    return {
      rs: 200,
      st: 200,
      rt: 200,
      kensou: '正',
    }
  }

  return {
    rs: 100,
    st: 100,
    rt: 200,
    kensou: '良',
  }
}

/**
 * 配電方式・三相フラグから各相の基準電圧と±10%の許容範囲を取得します。
 */
export function getPhase3VoltageRanges(
  haidenHoushiki: string | null | undefined,
  isThreePhase: boolean,
): {
  phase1: VoltageToleranceRange
  phase2: VoltageToleranceRange
  phase3: VoltageToleranceRange
} {
  const h = String(haidenHoushiki || '').toUpperCase()

  const calcRange = (target: number): VoltageToleranceRange => ({
    target,
    min: Math.round(target * 0.9 * 10) / 10, // 90% (例: 100V -> 90.0V, 200V -> 180.0V)
    max: Math.round(target * 1.1 * 10) / 10, // 110% (例: 100V -> 110.0V, 200V -> 220.0V)
  })

  // 三相400V系
  if (h.includes('400V') || h.includes('415V') || h.includes('440V')) {
    const r400 = calcRange(400)

    return { phase1: r400, phase2: r400, phase3: r400 }
  }

  // 三相200V系
  if (isThreePhase || h.includes('3Φ') || h.includes('3相')) {
    const r200 = calcRange(200)

    return { phase1: r200, phase2: r200, phase3: r200 }
  }

  // 単相3線式 (100/200V または 1Φ3W)
  if (h.includes('100/200V') || h.includes('1Φ3W')) {
    return {
      phase1: calcRange(100),
      phase2: calcRange(100),
      phase3: calcRange(200),
    }
  }

  // 単相200V
  if (h.includes('200V')) {
    const r200 = calcRange(200)

    return { phase1: r200, phase2: r200, phase3: r200 }
  }

  // デフォルト単相100V系 (R-N: 100V, T-N: 100V, R-T: 200V)
  return {
    phase1: calcRange(100),
    phase2: calcRange(100),
    phase3: calcRange(200),
  }
}

/**
 * 電圧測定値が±10%の許容範囲外かどうかを判定します。
 * 未入力または空文字の場合は false を返します。
 */
export function isVoltageOutOfRange(
  val: string | number | null | undefined,
  range: VoltageToleranceRange,
): boolean {
  if (val === '' || val === null || val === undefined) return false
  const num = typeof val === 'number' ? val : parseFloat(String(val).trim())

  if (Number.isNaN(num) || !Number.isFinite(num)) return false

  return num < range.min || num > range.max
}

/**
 * フェーズ3の検相が合格判定かどうかを取得します。
 * - 三相: '正'
 * - 単相: '良'
 */
export function isPhase3KensouPass(
  kensou: string | null | undefined,
  isThreePhase: boolean,
): boolean {
  if (!kensou) return false

  if (isThreePhase) {
    return kensou === '正'
  }

  return kensou === '良'
}

/**
 * オフライン同期待ちキューや差分表示用の測定値サマリー文字列を生成します。
 */
export function formatPhaseValues(
  phase: number,
  data?: Record<string, unknown>,
  isServer = false,
): string {
  if (!data) return '-'

  if (phase === 1) {
    const k = isServer ? data.p1Kakunin : data.kakunin
    const m = isServer ? data.p1Mashishime : data.mashishime

    return `確認: ${k ? '済' : '未'} / 増締: ${m ? '済' : '未'}`
  }
  if (phase === 2) {
    const r = isServer ? data.zetsuenR : data.rVal
    const s = isServer ? data.zetsuenS : data.sVal
    const t = isServer ? data.zetsuenT : data.tVal

    return `R: ${r ?? '-'}MΩ / S: ${s ?? '-'}MΩ / T: ${t ?? '-'}MΩ`
  }
  if (phase === 3) {
    const rs = isServer ? data.denatsuRs : data.rs
    const st = isServer ? data.denatsuSt : data.st
    const rt = isServer ? data.denatsuRt : data.rt

    return `RS: ${rs ?? '-'}V / ST: ${st ?? '-'}V / TR: ${rt ?? '-'}V`
  }

  return '-'
}

/**
 * 配電方式文字列から電気設備技術基準（内線規程）に準拠した絶縁抵抗基準値（MΩ）を取得します。
 * - 400V を含む場合: 0.4 MΩ 以上
 * - 100V または 100/200V を含む場合: 0.1 MΩ 以上 (単相3線100/200Vは対地電圧150V以下のため0.1MΩ)
 * - 200V を含む場合: 0.2 MΩ 以上
 * - その他（デフォルト）: 0.1 MΩ
 */
export function getPhase2Threshold(haidenHoushiki: string | null | undefined): number {
  const h = String(haidenHoushiki || '').toUpperCase()

  if (h.includes('400V') || h.includes('415V') || h.includes('440V')) {
    return 0.4
  }
  if (h.includes('100V') || h.includes('100/200V') || h.includes('100')) {
    return 0.1
  }
  if (h.includes('200V')) {
    return 0.2
  }

  return 0.1
}
