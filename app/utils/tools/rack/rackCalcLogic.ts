import type { MathStep } from '~/types/tools'
import { buildFormula, hlOk, hlVal } from '~/utils/math'

export interface RackCableInput {
  d: number
  n: number
}

export interface RackCalcInputs {
  mode: 'strong' | 'weak'
  layers?: number // 互換性のため残すが、tier1/tier2同時算出を行う
  rackHeight: number
  maxDepth: number
  cables: RackCableInput[]
  otherWidth: number
  marginRate?: number
  cableSpacing?: number
  sideMargin?: number
}

export interface RackTierResult {
  layers: 1 | 2
  title: string
  isApplicable: boolean // 2段で本数1本のみなどの場合
  wMain: number // 当該モードのケーブル必要幅
  wOther: number // 相乗り側の幅
  totalWidth: number
  selectedSize: number | null
  isOverflow: boolean // 有効高さを超えているか
  isSizeOver: boolean // 1200mmを超えているか
  maxCableStackHeight: number
  stackHeightDetailStr: string
  cablesWidth: number // 余裕係数・両端離隔適用前の純粋なケーブル占有幅
  cablesCount: number
}

export interface RackCalcResult {
  error: boolean
  mode: 'strong' | 'weak'
  tier1: RackTierResult
  tier2: RackTierResult
  maxDepth: number
  rackHeight: number
  marginRate: number
  cableSpacing: number
  sideMargin: number
  totalCablesCount: number
  // 既存コード互換用フィールド（基本はtier1平置きの値を参照）
  wStrong: number
  wWeak: number
  wSep: number
  totalWidth: number
  selectedSize: number | null
  isOverflow: boolean
  maxCableStackHeight: number
  maxStackDetailStr: string
  sumStrong: number
  sumWeak: number
}

/**
 * ケーブル外径と条数から、外径降順のケーブル直径リストを生成する
 */
export function getCableDiameters(cables: RackCableInput[]): number[] {
  const diams: number[] = []

  for (const cable of cables) {
    const d = cable.d ?? 0
    const n = cable.n ?? 0

    if (d > 0 && n > 0) {
      for (let i = 0; i < n; i++) {
        diams.push(d)
      }
    }
  }

  return diams.sort((a, b) => b - a)
}

/**
 * 1段積み（平置き）におけるケーブル占有幅を計算する
 */
export function calculateTier1CablesWidth(
  diams: number[],
  cableSpacing: number,
): number {
  if (diams.length === 0) return 0

  return diams.reduce((sum, d) => sum + d + cableSpacing, 0)
}

/**
 * 2段積み（ビンパッキング式）におけるケーブル占有幅を計算する
 * 太い順に下段（太い方 ceil(N/2)本）と上段（細い方 floor(N/2)本）に割り当て、最大幅を採用する
 */
export function calculateTier2CablesWidth(
  diams: number[],
  cableSpacing: number,
): { width: number, lowerWidth: number, upperWidth: number } {
  const count = diams.length

  if (count <= 1) {
    const w = count === 1 ? diams[0]! + cableSpacing : 0

    return { width: w, lowerWidth: w, upperWidth: 0 }
  }

  const lowerCount = Math.ceil(count / 2)
  let lowerWidth = 0
  let upperWidth = 0

  for (let i = 0; i < count; i++) {
    const w = diams[i]! + cableSpacing

    if (i < lowerCount) {
      lowerWidth += w
    }
    else {
      upperWidth += w
    }
  }

  return {
    width: Math.max(lowerWidth, upperWidth),
    lowerWidth,
    upperWidth,
  }
}

/**
 * 指定された段数で積み重ねた場合のケーブル最大高さを計算する
 */
export function getStackHeightFromDiams(
  diams: number[],
  layers: number,
): { height: number, detailStr: string } {
  let h = 0
  const terms: string[] = []

  for (let i = 0; i < Math.min(layers, diams.length); i++) {
    const val = diams[i]!

    h += val
    terms.push(val.toFixed(1))
  }

  return {
    height: h,
    detailStr: terms.length > 0 ? terms.join(' + ') : '0',
  }
}

/**
 * ケーブルリストの総必要幅（1段積み換算）を算出するための基準和を計算する（後方互換性）
 */
export function calculateSectionSumFromCables(
  cables: RackCableInput[],
  cableSpacing = 10,
): number {
  let sum = 0

  for (const cable of cables) {
    const d = cable.d ?? 0
    const n = cable.n ?? 0

    if (d > 0 && n > 0) {
      sum += (d + cableSpacing) * n
    }
  }

  return sum
}

/**
 * ケーブルラックサイズ選定のメイン計算処理（1段・2段同時算出）
 */
export function calculateRackSize(
  inputs: RackCalcInputs,
  standardRackSizes: number[],
): RackCalcResult {
  const {
    mode,
    rackHeight,
    maxDepth,
    cables,
    otherWidth,
  } = inputs

  const isStrong = mode === 'strong'
  const marginRate = inputs.marginRate ?? (isStrong ? 1.2 : 0.6)
  const cableSpacing = inputs.cableSpacing ?? 10
  const sideMargin = inputs.sideMargin ?? (isStrong ? 60 : 120)

  const sortedDiams = getCableDiameters(cables)
  const totalCablesCount = sortedDiams.length
  const maxDepthVal = maxDepth ?? 0

  // --- Tier 1 (1段敷設) 計算 ---
  const tier1CablesWidth = calculateTier1CablesWidth(sortedDiams, cableSpacing)
  let tier1WMain = 0

  if (totalCablesCount > 0) {
    tier1WMain = Number((tier1CablesWidth * marginRate + sideMargin).toFixed(1))
  }
  const tier1TotalWidth = tier1WMain + (otherWidth || 0)
  const tier1Selected = standardRackSizes.find(s => s >= tier1TotalWidth) || null
  const tier1Stack = getStackHeightFromDiams(sortedDiams, 1)
  const tier1Overflow = tier1Stack.height > maxDepthVal

  const tier1Result: RackTierResult = {
    layers: 1,
    title: '1段敷設（平置き・標準）',
    isApplicable: true,
    wMain: tier1WMain,
    wOther: otherWidth || 0,
    totalWidth: tier1TotalWidth,
    selectedSize: tier1Selected,
    isOverflow: tier1Overflow,
    isSizeOver: tier1TotalWidth > 1200 || (!tier1Selected && tier1TotalWidth > 0),
    maxCableStackHeight: tier1Stack.height,
    stackHeightDetailStr: tier1Stack.detailStr,
    cablesWidth: tier1CablesWidth,
    cablesCount: totalCablesCount,
  }

  // --- Tier 2 (2段敷設) 計算 ---
  const tier2Data = calculateTier2CablesWidth(sortedDiams, cableSpacing)
  let tier2WMain = 0

  if (totalCablesCount > 0) {
    tier2WMain = Number((tier2Data.width * marginRate + sideMargin).toFixed(1))
  }
  const tier2TotalWidth = tier2WMain + (otherWidth || 0)
  const tier2Selected = standardRackSizes.find(s => s >= tier2TotalWidth) || null
  const tier2Stack = getStackHeightFromDiams(sortedDiams, 2)
  const tier2Overflow = tier2Stack.height > maxDepthVal
  const tier2Applicable = totalCablesCount >= 2

  const tier2Result: RackTierResult = {
    layers: 2,
    title: '2段敷設（省スペース）',
    isApplicable: tier2Applicable,
    wMain: tier2WMain,
    wOther: otherWidth || 0,
    totalWidth: tier2TotalWidth,
    selectedSize: tier2Selected,
    isOverflow: tier2Overflow,
    isSizeOver: tier2TotalWidth > 1200 || (!tier2Selected && tier2TotalWidth > 0),
    maxCableStackHeight: tier2Stack.height,
    stackHeightDetailStr: tier2Stack.detailStr,
    cablesWidth: tier2Data.width,
    cablesCount: totalCablesCount,
  }

  // 後方互換フィールド
  const wStrong = isStrong ? tier1WMain : (otherWidth || 0)
  const wWeak = isStrong ? (otherWidth || 0) : tier1WMain

  return {
    error: tier1Result.isSizeOver && tier2Result.isSizeOver,
    mode,
    tier1: tier1Result,
    tier2: tier2Result,
    maxDepth: maxDepthVal,
    rackHeight: rackHeight ?? 0,
    marginRate,
    cableSpacing,
    sideMargin,
    totalCablesCount,
    wStrong,
    wWeak,
    wSep: 0,
    totalWidth: tier1TotalWidth,
    selectedSize: tier1Selected,
    isOverflow: tier1Overflow,
    maxCableStackHeight: tier1Stack.height,
    maxStackDetailStr: tier1Stack.detailStr,
    sumStrong: isStrong ? tier1CablesWidth : 0,
    sumWeak: isStrong ? 0 : tier1CablesWidth,
  }
}

/**
 * MathJax用の数式ステップデータを生成する
 */
export function generateMathData(
  inputs: RackCalcInputs,
  result: RackCalcResult | null,
): MathStep[] {
  const mathStepData: MathStep[] = []

  const isStrong = inputs.mode === 'strong'
  const marginRate = inputs.marginRate ?? (isStrong ? 1.2 : 0.6)
  const cableSpacing = inputs.cableSpacing ?? 10
  const sideMargin = inputs.sideMargin ?? (isStrong ? 60 : 120)

  const marginRateHl = hlVal(marginRate, 'K', 1)
  const cableSpacingHl = hlVal(cableSpacing, 'S', 0)
  const sideMarginHl = hlVal(sideMargin, 'W_{side}', 0)
  const otherHl = hlVal(inputs.otherWidth, isStrong ? 'W_{weak}' : 'W_{strong}', 1)

  const modeVar = isStrong ? 'W_{strong}' : 'W_{weak}'
  const modeVar1 = isStrong ? 'W_{strong,1}' : 'W_{weak,1}'
  const modeVar2 = isStrong ? 'W_{strong,2}' : 'W_{weak,2}'

  // ① 1段敷設（平置き）の必要幅
  const t1 = result?.tier1
  const t1SumHl = hlVal(t1?.cablesWidth, '\\Sigma(D+S)', 1)
  const t1ResHl = t1 && t1.wMain > 0 ? hlOk(t1.wMain.toFixed(1)) : '\\text{---}'

  const t1Sub = `${marginRateHl} \\times ${t1SumHl} + ${sideMarginHl}`
  const t1Tex = buildFormula(
    modeVar1,
    `K \\times \\Sigma(D + S) + W_{side} \\\\ &= ${t1Sub}`,
    t1ResHl,
    'mm',
  )

  mathStepData.push({
    title: '① 1段敷設（平置き）の必要幅算出',
    tex: t1Tex,
    legend: [
      `\\(${modeVar1}\\): 1段敷設時の必要幅 [mm]`,
      '\\(D\\): ケーブル外径 [mm]',
      `\\(S\\): ケーブル間隔 (${cableSpacing} mm)`,
      `\\(K\\): 余裕係数 (${marginRate})`,
      `\\(W_{side}\\): 両端離隔 (${sideMargin} mm)`,
    ],
  })

  // ② 2段敷設（省スペース）の必要幅
  const t2 = result?.tier2
  const t2SumHl = hlVal(t2?.cablesWidth, 'W_{cables}', 1)
  const t2ResHl = t2 && t2.wMain > 0 ? hlOk(t2.wMain.toFixed(1)) : '\\text{---}'

  const t2Tex = buildFormula(
    modeVar2,
    `K \\times \\max(W_{lower}, W_{upper}) + W_{side} \\\\ &= ${marginRateHl} \\times ${t2SumHl} + ${sideMarginHl}`,
    t2ResHl,
    'mm',
  )

  mathStepData.push({
    title: '② 2段敷設（省スペース）の必要幅算出',
    tex: t2Tex,
    legend: [
      `\\(${modeVar2}\\): 2段敷設時の必要幅 [mm]`,
      '\\(W_{lower}\\): 下段（太物側）のケーブル幅合計 [mm]',
      '\\(W_{upper}\\): 上段（細物側）のケーブル幅合計 [mm]',
      `\\(K\\): 余裕係数 (${marginRate})`,
      `\\(W_{side}\\): 両端離隔 (${sideMargin} mm)`,
    ],
  })

  // ③ 相乗り必要幅（手入力加算）
  const otherVar = isStrong ? 'W_{weak}' : 'W_{strong}'
  mathStepData.push({
    title: `③ 相乗り必要幅（手入力加算）`,
    tex: `${otherVar} = ${inputs.otherWidth > 0 ? hlOk(inputs.otherWidth.toFixed(1)) : '0'} \\text{ [mm]}`,
    legend: [`\\(${otherVar}\\): 相乗り側の必要幅 [mm]`],
  })

  // ④ 合計ラック幅の算出（1段基準）
  const t1TotalHl = t1 && t1.totalWidth > 0 ? hlOk(t1.totalWidth.toFixed(1)) : '\\text{---}'
  const t2TotalHl = t2 && t2.totalWidth > 0 ? hlOk(t2.totalWidth.toFixed(1)) : '\\text{---}'

  const t4Tex = `\\begin{aligned} \\text{1段合計:} \\quad W_{total1} &= ${modeVar1} + ${otherVar} = ${t1TotalHl} \\text{ [mm]} \\\\ \\text{2段合計:} \\quad W_{total2} &= ${modeVar2} + ${otherVar} = ${t2TotalHl} \\text{ [mm]} \\end{aligned}`

  mathStepData.push({
    title: '④ 合計ラック幅と推奨サイズ選定',
    tex: t4Tex,
    legend: [
      '\\(W_{total1}\\): 1段敷設時の合計ラック幅 [mm]',
      '\\(W_{total2}\\): 2段敷設時の合計ラック幅 [mm]',
    ],
  })

  return mathStepData
}
