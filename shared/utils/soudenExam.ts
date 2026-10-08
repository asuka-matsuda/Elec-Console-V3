/**
 * 送電試験フェーズ完了判定共通ロジック（Single Source of Truth）
 *
 * クライアント（UI表示・バリデーション）とサーバー（集計・進捗判定）の双方が参照する
 * Phase 1〜3 の試験完了判定純粋関数を提供します。
 */

import type { CircuitItem, SoudenStats } from '../types/circuit'

/**
 * 送電試験の判定対象となる回路オブジェクトの共通インターフェース
 */
export type ExamJudgeableCircuit = {
  p1Kakunin?: boolean | null
  p1Mashishime?: boolean | null
  p1ConfirmedAt?: Date | string | null
  p2IsComplete?: boolean | null
  p2ConfirmedAt?: Date | string | null
  p3IsComplete?: boolean | null
  p3ConfirmedAt?: Date | string | null
}

/**
 * フェーズ1（外観・配線確認および端子増締め）が完了しているかを判定
 */
export function isPhase1Complete(c: ExamJudgeableCircuit): boolean {
  return Boolean(c.p1ConfirmedAt && c.p1Kakunin && c.p1Mashishime)
}

/**
 * フェーズ2（耐電圧・絶縁抵抗測定）が完了しているかを判定
 */
export function isPhase2Complete(c: ExamJudgeableCircuit): boolean {
  return Boolean(c.p2ConfirmedAt && c.p2IsComplete)
}

/**
 * フェーズ3（送電・検相・電圧測定）が完了しているかを判定
 */
export function isPhase3Complete(c: ExamJudgeableCircuit): boolean {
  return Boolean(c.p3ConfirmedAt && c.p3IsComplete)
}

/**
 * 指定したフェーズ番号（1〜3）が完了しているかを判定
 */
export function isPhaseComplete(c: ExamJudgeableCircuit, phase: number): boolean {
  if (phase === 1) return isPhase1Complete(c)
  if (phase === 2) return isPhase2Complete(c)
  if (phase === 3) return isPhase3Complete(c)

  return false
}

function calcPct(completed: number, total: number): number {
  if (total <= 0) return 0

  return Math.round((completed / total) * 100)
}

/**
 * 回路リストから送電試験の全体進捗統計（SoudenStats）を集計・算出
 */
export function calculateSoudenStats(circuits: CircuitItem[]): SoudenStats {
  let trunkTotal = 0
  let trunkExcluded = 0
  let trunkP1 = 0
  let trunkP2 = 0
  let trunkP3 = 0

  let secTotal = 0
  let secExcluded = 0
  let secP1 = 0
  let secP2 = 0
  let secP3 = 0

  for (const c of circuits) {
    const isTrunk = c.keiTo === '幹線'
    const isExcluded = Boolean(c.isExcluded)

    if (isTrunk) {
      if (isExcluded) {
        trunkExcluded++
      }
      else {
        trunkTotal++
        if (isPhase1Complete(c)) trunkP1++
        if (isPhase2Complete(c)) trunkP2++
        if (isPhase3Complete(c)) trunkP3++
      }
    }
    else {
      if (isExcluded) {
        secExcluded++
      }
      else {
        secTotal++
        if (isPhase1Complete(c)) secP1++
        if (isPhase2Complete(c)) secP2++
        if (isPhase3Complete(c)) secP3++
      }
    }
  }

  const totalActive = trunkTotal + secTotal
  const totalExcluded = trunkExcluded + secExcluded
  const p1Total = trunkP1 + secP1
  const p2Total = trunkP2 + secP2
  const p3Total = trunkP3 + secP3

  const totalDenominator = totalActive * 3
  const totalCompleted = p1Total + p2Total + p3Total
  const totalPct = calcPct(totalCompleted, totalDenominator)

  const trunkOverallPct = calcPct(trunkP1 + trunkP2 + trunkP3, trunkTotal * 3)
  const secOverallPct = calcPct(secP1 + secP2 + secP3, secTotal * 3)

  return {
    totalPct,
    totalCircuits: circuits.length,
    totalActive,
    totalExcluded,
    p1Total,
    p2Total,
    p3Total,

    trunkTotal,
    trunkExcluded,
    trunkP1,
    trunkP1Pct: calcPct(trunkP1, trunkTotal),
    trunkP2,
    trunkP2Pct: calcPct(trunkP2, trunkTotal),
    trunkP3,
    trunkP3Pct: calcPct(trunkP3, trunkTotal),
    trunkOverallPct,

    secTotal,
    secExcluded,
    secP1,
    secP1Pct: calcPct(secP1, secTotal),
    secP2,
    secP2Pct: calcPct(secP2, secTotal),
    secP3,
    secP3Pct: calcPct(secP3, secTotal),
    secOverallPct,
  }
}

export interface VoltageToleranceRange {
  target: number
  min: number
  max: number
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
    min: Math.round(target * 0.9 * 10) / 10,
    max: Math.round(target * 1.1 * 10) / 10,
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

export interface PhaseDiffItem {
  key: string
  label: string
  serverValue: string
  clientValue: string
  isDifferent: boolean
}

/**
 * 送電試験のサーバーデータとオフライン入力（Payload）を比較し、項目ごとの差分情報を抽出します。
 */
export function getPhaseDiffItems(
  phase: number,
  serverData?: Record<string, unknown>,
  clientPayload?: Record<string, unknown>,
): PhaseDiffItem[] {
  const s = serverData || {}
  const c = clientPayload || {}
  const diffs: PhaseDiffItem[] = []

  if (phase === 1) {
    const sKakunin = Boolean(s.p1Kakunin)
    const cKakunin = Boolean(c.kakunin)

    diffs.push({
      key: 'kakunin',
      label: '確認',
      serverValue: sKakunin ? '済' : '未',
      clientValue: cKakunin ? '済' : '未',
      isDifferent: sKakunin !== cKakunin,
    })

    const sMashi = Boolean(s.p1Mashishime)
    const cMashi = Boolean(c.mashishime)

    diffs.push({
      key: 'mashishime',
      label: '増締',
      serverValue: sMashi ? '済' : '未',
      clientValue: cMashi ? '済' : '未',
      isDifferent: sMashi !== cMashi,
    })

    const sBikou = (s.p1Bikou as string) || ''
    const cBikou = (c.bikou as string) || ''

    if (sBikou || cBikou) {
      diffs.push({
        key: 'bikou',
        label: '備考',
        serverValue: sBikou || '-',
        clientValue: cBikou || '-',
        isDifferent: sBikou !== cBikou,
      })
    }
  }
  else if (phase === 2) {
    const formatMeg = (v: unknown) => (v != null && v !== '' ? `${v} MΩ` : '-')
    const sR = s.zetsuenR
    const cR = c.rVal

    diffs.push({
      key: 'rVal',
      label: 'R相 (MΩ)',
      serverValue: formatMeg(sR),
      clientValue: formatMeg(cR),
      isDifferent: String(sR ?? '') !== String(cR ?? ''),
    })

    const sS = s.zetsuenS
    const cS = c.sVal

    diffs.push({
      key: 'sVal',
      label: 'S相 (MΩ)',
      serverValue: formatMeg(sS),
      clientValue: formatMeg(cS),
      isDifferent: String(sS ?? '') !== String(cS ?? ''),
    })

    const sT = s.zetsuenT
    const cT = c.tVal

    diffs.push({
      key: 'tVal',
      label: 'T相 (MΩ)',
      serverValue: formatMeg(sT),
      clientValue: formatMeg(cT),
      isDifferent: String(sT ?? '') !== String(cT ?? ''),
    })

    const sKiroku = (s.zetsuenKirokuSha as string) || ''
    const cKiroku = (c.kirokuSha as string) || ''

    if (sKiroku || cKiroku) {
      diffs.push({
        key: 'kirokuSha',
        label: '測定者',
        serverValue: sKiroku || '-',
        clientValue: cKiroku || '-',
        isDifferent: sKiroku !== cKiroku,
      })
    }

    const sBikou = (s.p2Bikou as string) || ''
    const cBikou = (c.bikou as string) || ''

    if (sBikou || cBikou) {
      diffs.push({
        key: 'bikou',
        label: '備考',
        serverValue: sBikou || '-',
        clientValue: cBikou || '-',
        isDifferent: sBikou !== cBikou,
      })
    }
  }
  else if (phase === 3) {
    const formatVolt = (v: unknown) => (v != null && v !== '' ? `${v} V` : '-')
    const sRs = s.denatsuRs
    const cRs = c.rs

    diffs.push({
      key: 'rs',
      label: 'RS相 (V)',
      serverValue: formatVolt(sRs),
      clientValue: formatVolt(cRs),
      isDifferent: String(sRs ?? '') !== String(cRs ?? ''),
    })

    const sSt = s.denatsuSt
    const cSt = c.st

    diffs.push({
      key: 'st',
      label: 'ST相 (V)',
      serverValue: formatVolt(sSt),
      clientValue: formatVolt(cSt),
      isDifferent: String(sSt ?? '') !== String(cSt ?? ''),
    })

    const sRt = s.denatsuRt
    const cRt = c.rt

    diffs.push({
      key: 'rt',
      label: 'TR相 (V)',
      serverValue: formatVolt(sRt),
      clientValue: formatVolt(cRt),
      isDifferent: String(sRt ?? '') !== String(cRt ?? ''),
    })

    const sKensou = (s.kensou as string) || ''
    const cKensou = (c.kensou as string) || ''

    diffs.push({
      key: 'kensou',
      label: '検相',
      serverValue: sKensou || '-',
      clientValue: cKensou || '-',
      isDifferent: sKensou !== cKensou,
    })

    const sBikou = (s.p3Bikou as string) || ''
    const cBikou = (c.bikou as string) || ''

    if (sBikou || cBikou) {
      diffs.push({
        key: 'bikou',
        label: '備考',
        serverValue: sBikou || '-',
        clientValue: cBikou || '-',
        isDifferent: sBikou !== cBikou,
      })
    }
  }

  return diffs
}

/**
 * 配電方式文字列から電気設備技術基準（内線規程）に準拠した絶縁抵抗基準値（MΩ）を取得します。
 * - 400V を含む場合: 0.4 MΩ 以上
 * - 100V または 100/200V を含む場合: 0.1 MΩ 以上
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

/**
 * 使用電圧が300V超かどうかを判定
 * 400V, 415V, 440V, 380V, 6600V 等の表記を検知
 */
export function isVoltageOver300V(haidenHoushiki?: string | null): boolean {
  if (!haidenHoushiki) return false
  const h = String(haidenHoushiki).toUpperCase()

  if (h.includes('400V') || h.includes('415V') || h.includes('440V') || h.includes('380V') || h.includes('6600V')) {
    return true
  }

  const match = h.match(/(\d+)V/)

  if (match && match[1]) {
    const v = Number.parseInt(match[1], 10)

    if (v > 300) return true
  }

  return false
}

/**
 * 遮断器が漏電遮断器（ELCB / ELB）かどうかを判定
 */
export function isElcbBreaker(shadankiShubetsu?: string | null): boolean {
  if (!shadankiShubetsu) return false
  const s = String(shadankiShubetsu).toUpperCase()

  return s.includes('ELCB') || s.includes('ELB') || s.includes('漏電')
}

/**
 * 接地種別判定パラメータ
 */
export interface DetermineSetsuchiParams {
  setsuchiManual?: string | null
  setsuchiC?: string | null
  setsuchiD?: string | null
  setsuchiDelb?: string | null
  setsuchiUmu?: string | null
  haidenHoushiki?: string | null
  keiTo?: string | null
  shadankiShubetsu?: string | null
}

/**
 * 接地種別（setsuchiList）を自動判定・決定する
 *
 * 1. 手動（接地（手動））に記載があれば手動が最優先
 * 2. 接地有無が「無」の場合は接地対象外（'-'）
 * 3. Excel上の各接地列（C種, D種, D(ELB)種）に直接記載がある場合はそれを優先結合
 * 4. 基本自動判定ロジック:
 *    - 使用電圧が300V超: 'C種'
 *    - 使用電圧が300V以下:
 *      - 幹線がTRUE: 'D種 / D（ELB）種'
 *      - 幹線がFALSE かつ MCCB: 'D種'
 *      - 幹線がFALSE かつ ELCB: 'D（ELB）種'
 */
export function determineSetsuchiType(params: DetermineSetsuchiParams): string | null {
  // 1. 手動が最優先
  const manual = params.setsuchiManual?.trim()

  if (manual) {
    return manual
  }

  // 2. 接地有無が「無」の場合は接地対象外
  const umu = params.setsuchiUmu?.trim()

  if (umu === '無') {
    return '-'
  }

  // 3. 電気設備技術基準に基づくロジック（最大2本）
  const isOver300 = isVoltageOver300V(params.haidenHoushiki)

  if (isOver300) {
    // 使用電圧が300V超: C種（最大1本）
    const valC = params.setsuchiC?.trim()

    if (!valC || valC === '-' || valC === '無') {
      return valC === '-' ? '-' : 'C種'
    }

    return valC === '○' || valC === '有' ? 'C種' : valC
  }

  // 使用電圧が300V以下
  const isTrunk = params.keiTo === '幹線'

  if (isTrunk) {
    // 幹線がTRUE: D種 と D（ELB）種（最大2本）
    const valD = params.setsuchiD?.trim()
    const valDelb = params.setsuchiDelb?.trim()

    const cleanD = (valD && valD !== '-' && valD !== '無')
      ? (valD === '○' || valD === '有' ? 'D種' : valD)
      : null

    const cleanDelb = (valDelb && valDelb !== '-' && valDelb !== '無')
      ? (valDelb === '○' || valDelb === '有' ? 'D（ELB）種' : valDelb)
      : null

    if (cleanD && cleanDelb) {
      return `${cleanD} / ${cleanDelb}`
    }
    if (cleanD) {
      return cleanD
    }
    if (cleanDelb) {
      return cleanDelb
    }

    if (valD === '-' || valDelb === '-') {
      return '-'
    }

    return 'D種 / D（ELB）種'
  }

  // 幹線がFALSE（二次側 / 分岐回路）
  const isElcb = isElcbBreaker(params.shadankiShubetsu)

  if (isElcb) {
    // 幹線がFALSE かつ ELCB: D（ELB）種（最大1本）
    const valDelb = params.setsuchiDelb?.trim()

    if (!valDelb || valDelb === '-' || valDelb === '無') {
      return valDelb === '-' ? '-' : 'D（ELB）種'
    }

    return valDelb === '○' || valDelb === '有' ? 'D（ELB）種' : valDelb
  }

  // 幹線がFALSE かつ MCCB（またはデフォルト）: D種（最大1本）
  const valD = params.setsuchiD?.trim()

  if (!valD || valD === '-' || valD === '無') {
    return valD === '-' ? '-' : 'D種'
  }

  return valD === '○' || valD === '有' ? 'D種' : valD
}
