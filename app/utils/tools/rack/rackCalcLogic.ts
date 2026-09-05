import type { MathStep } from '~/types/tools'
import { buildFormula, hlOk, hlVal } from '~/utils/math'

export interface RackCableInput {
  d: number
  n: number
}

export interface RackCalcInputs {
  mode: 'strong' | 'weak'
  layers: number
  rackHeight: number
  maxDepth: number
  cables: RackCableInput[]
  otherWidth: number
}

export interface RackCalcResult {
  error: boolean
  mode: 'strong' | 'weak'
  wStrong: number
  wWeak: number
  wSep: number
  totalWidth: number
  selectedSize: number | null
  isOverflow: boolean
  maxCableStackHeight: number
  maxStackDetailStr: string
  maxDepth: number
  rackHeight: number
  sumStrong: number
  sumWeak: number
}

/**
 * ケーブル外径と条数から、ケーブルの直径リストを生成する
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

  return diams
}

/**
 * 指定された段数で積み重ねた場合のケーブル最大高さを計算する
 */
export function getStackHeightFromDiams(
  diams: number[],
  layers: number,
): { height: number, detailStr: string } {
  const sortedDiams = [...diams].sort((a, b) => b - a)
  let h = 0
  const terms: string[] = []

  for (let i = 0; i < Math.min(layers, sortedDiams.length); i++) {
    const val = sortedDiams[i]!

    h += val
    terms.push(val.toFixed(1))
  }

  return {
    height: h,
    detailStr: terms.length > 0 ? terms.join(' + ') : '0',
  }
}

/**
 * ケーブルリストの総必要幅（1段積み換算）を算出するための基準和を計算する
 */
export function calculateSectionSumFromCables(
  cables: RackCableInput[],
): number {
  let sum = 0

  for (const cable of cables) {
    const d = cable.d ?? 0
    const n = cable.n ?? 0

    if (d > 0 && n > 0) {
      sum += (d + 10) * n
    }
  }

  return sum
}

/**
 * ラック幅およびはみ出し判定などのメイン計算処理を行う
 */
export function calculateRackSize(
  inputs: RackCalcInputs,
  standardRackSizes: number[],
): RackCalcResult {
  const {
    mode,
    layers,
    rackHeight,
    maxDepth,
    cables,
    otherWidth,
  } = inputs

  let wStrong = 0
  let wWeak = 0
  const wSep = 0

  let stackH: { height: number, detailStr: string }

  let sumStrong = 0
  let sumWeak = 0

  if (mode === 'strong') {
    sumStrong = calculateSectionSumFromCables(cables)
    if (sumStrong > 0) {
      wStrong = (1.2 * (sumStrong + 60)) / Math.max(1, layers ?? 1)
    }
    wWeak = otherWidth || 0
    stackH = getStackHeightFromDiams(
      getCableDiameters(cables),
      layers ?? 1,
    )
  }
  else {
    sumWeak = calculateSectionSumFromCables(cables)
    if (sumWeak > 0) {
      wWeak = (0.6 * (sumWeak + 120)) / Math.max(1, layers ?? 1)
    }
    wStrong = otherWidth || 0
    stackH = getStackHeightFromDiams(
      getCableDiameters(cables),
      layers ?? 1,
    )
  }

  const maxCableStackHeight = stackH.height
  const maxStackDetailStr = stackH.detailStr

  const maxDepthVal = maxDepth ?? 0
  const isOverflow = maxCableStackHeight > maxDepthVal

  const totalWidth = wStrong + wWeak
  const selectedSize = standardRackSizes.find(s => s >= totalWidth) || null

  return {
    error: !selectedSize && totalWidth > 0,
    mode,
    wStrong,
    wWeak,
    wSep,
    totalWidth,
    selectedSize,
    isOverflow,
    maxCableStackHeight,
    maxStackDetailStr,
    maxDepth: maxDepth ?? 0,
    rackHeight: rackHeight ?? 0,
    sumStrong,
    sumWeak,
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
  const layersHl = hlVal(inputs.layers, 'L', 0)
  const otherHl = hlVal(inputs.otherWidth, isStrong ? 'W_{weak}' : 'W_{strong}', 1)

  const wStrongHl = hlVal(result?.wStrong, 'W_{strong}', 1)
  const wWeakHl = hlVal(result?.wWeak, 'W_{weak}', 1)

  if (isStrong) {
    // 1. 強電ケーブルの必要幅算出
    const sumStrongHl = hlVal(result?.sumStrong, '\\Sigma(D+10)', 1)
    const lS = inputs.layers ?? 1
    const divStrSym = lS > 1 ? ` \\div L` : ``
    const divStrSub = lS > 1 ? ` \\div ${layersHl}` : ``
    const legendList = [
      '\\(W_{strong}\\): 強電ケーブルの必要幅 [mm]',
      '\\(D\\): ケーブル外径 [mm]',
      '\\(1.2\\): 余裕係数 (+20%)',
      '\\(60\\): 両端の離隔距離 [mm]',
    ]

    if (lS > 1) legendList.push(`\\(L\\): 段積み数 [段]`)

    const rightSideSym = `1.2 \\times \\{ \\sum (D + 10) + 60 \\}${divStrSym}`
    const rightSideSub = `1.2 \\times \\{ ${sumStrongHl} + 60 \\}${divStrSub}`
    const resLine
      = result?.sumStrong !== undefined && result.sumStrong > 0
        ? hlOk(result.wStrong.toFixed(1))
        : '\\text{---}'

    const tex = buildFormula(
      'W_{strong}',
      rightSideSym + ' \\\\ &= ' + rightSideSub,
      resLine,
      'mm',
    )

    mathStepData.push({
      title: '① 強電ケーブルの必要幅算出',
      tex,
      legend: legendList,
    })

    // 2. 弱電必要幅（入力値）
    mathStepData.push({
      title: '② 弱電必要幅（手入力加算）',
      tex: `W_{weak} = ${inputs.otherWidth > 0 ? hlOk(inputs.otherWidth.toFixed(1)) : '0'} \\text{ [mm]}`,
      legend: ['\\(W_{weak}\\): 弱電側の必要幅 [mm]（相乗り時に入力）'],
    })

    // 3. 合計ラック幅の算出
    const legend3 = [
      '\\(W_{total}\\): 合計ラック幅 [mm]',
      '\\(W_{strong}\\): 強電幅 [mm]',
      '\\(W_{weak}\\): 弱電幅 [mm]',
    ]
    const tex3 = buildFormula(
      'W_{total}',
      `W_{strong} + W_{weak} \\\\ &= ${wStrongHl} + ${otherHl}`,
      result ? hlOk(result.totalWidth.toFixed(1)) : '\\text{---}',
      'mm',
    )

    mathStepData.push({
      title: '③ 合計ラック幅の算出',
      tex: tex3,
      legend: legend3,
    })
  }
  else {
    // 1. 弱電ケーブルの必要幅算出
    const sumWeakHl = hlVal(result?.sumWeak, '\\Sigma(D+10)', 1)
    const lW = inputs.layers ?? 1
    const divStrSym = lW > 1 ? ` \\div L` : ``
    const divStrSub = lW > 1 ? ` \\div ${layersHl}` : ``
    const legendList = [
      '\\(W_{weak}\\): 弱電ケーブルの必要幅 [mm]',
      '\\(D\\): ケーブル外径 [mm]',
      '\\(0.6\\): 集約低減係数',
      '\\(120\\): 端部・セパレータ離隔距離 [mm]',
    ]

    if (lW > 1) legendList.push(`\\(L\\): 段積み数 [段]`)

    const rightSideSym = `0.6 \\times \\{ \\sum (D + 10) + 120 \\}${divStrSym}`
    const rightSideSub = `0.6 \\times \\{ ${sumWeakHl} + 120 \\}${divStrSub}`
    const resLine
      = result?.sumWeak !== undefined && result.sumWeak > 0
        ? hlOk(result.wWeak.toFixed(1))
        : '\\text{---}'

    const tex = buildFormula(
      'W_{weak}',
      rightSideSym + ' \\\\ &= ' + rightSideSub,
      resLine,
      'mm',
    )

    mathStepData.push({
      title: '① 弱電ケーブルの必要幅算出',
      tex,
      legend: legendList,
    })

    // 2. 強電必要幅（入力値）
    mathStepData.push({
      title: '② 強電必要幅（手入力加算）',
      tex: `W_{strong} = ${inputs.otherWidth > 0 ? hlOk(inputs.otherWidth.toFixed(1)) : '0'} \\text{ [mm]}`,
      legend: ['\\(W_{strong}\\): 強電側の必要幅 [mm]（相乗り時に入力）'],
    })

    // 3. 合計ラック幅の算出
    const legend3 = [
      '\\(W_{total}\\): 合計ラック幅 [mm]',
      '\\(W_{weak}\\): 弱電幅 [mm]',
      '\\(W_{strong}\\): 強電幅 [mm]',
    ]
    const tex3 = buildFormula(
      'W_{total}',
      `W_{weak} + W_{strong} \\\\ &= ${wWeakHl} + ${otherHl}`,
      result ? hlOk(result.totalWidth.toFixed(1)) : '\\text{---}',
      'mm',
    )

    mathStepData.push({
      title: '③ 合計ラック幅の算出',
      tex: tex3,
      legend: legend3,
    })
  }

  return mathStepData
}
