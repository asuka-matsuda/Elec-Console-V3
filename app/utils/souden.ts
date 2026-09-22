/**
 * 送電試験（Phase 1〜3）共通ユーティリティ関数
 *
 * @description 単相/三相の相名称計算、数値パース、測定値フォーマッタ、標準値定義を提供します。
 */

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
      kensou: '正相',
    }
  }

  return {
    rs: 100,
    st: 100,
    rt: 200,
    kensou: '点灯確認(良)',
  }
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
