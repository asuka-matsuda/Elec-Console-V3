import type { MathStep } from '~/components/ToolMathBasisModal.vue'
import { buildFormula, hlOk, hlVal } from '~/utils/math'

export interface RackCableInput {
  d: number
  n: number
}

export interface RackCalcInputs {
  isStrong: boolean
  isWeak: boolean
  lStrong: number
  lWeak: number
  rackHeight: number
  maxDepth: number
  strongCables: RackCableInput[]
  weakCables: RackCableInput[]
  separatorWidth: number
}

export interface RackCalcResult {
  error: boolean
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
    isStrong,
    isWeak,
    lStrong,
    lWeak,
    rackHeight,
    maxDepth,
    strongCables,
    weakCables,
    separatorWidth,
  } = inputs

  let wStrong = 0
  let wWeak = 0
  let wSep = 0

  let stackHStrong = { height: 0, detailStr: '0' }
  let stackHWeak = { height: 0, detailStr: '0' }

  let sumStrong = 0
  let sumWeak = 0

  if (isStrong) {
    sumStrong = calculateSectionSumFromCables(strongCables)
    if (sumStrong > 0)
      wStrong = (1.2 * (sumStrong + 60)) / Math.max(1, lStrong ?? 1)
    stackHStrong = getStackHeightFromDiams(
      getCableDiameters(strongCables),
      lStrong ?? 1,
    )
  }
  if (isWeak) {
    sumWeak = calculateSectionSumFromCables(weakCables)
    if (sumWeak > 0) wWeak = (0.6 * (sumWeak + 120)) / Math.max(1, lWeak ?? 1)
    stackHWeak = getStackHeightFromDiams(
      getCableDiameters(weakCables),
      lWeak ?? 1,
    )
  }

  let maxCableStackHeight: number
  let maxStackDetailStr: string

  if (stackHStrong.height >= stackHWeak.height) {
    maxCableStackHeight = stackHStrong.height
    maxStackDetailStr = stackHStrong.detailStr
  }
  else {
    maxCableStackHeight = stackHWeak.height
    maxStackDetailStr = stackHWeak.detailStr
  }

  const maxDepthVal = maxDepth ?? 0
  const isOverflow = maxCableStackHeight > maxDepthVal

  if (
    isStrong
    && isWeak
    && separatorWidth !== undefined
    && separatorWidth !== null
  ) {
    wSep = separatorWidth
  }

  const totalWidth = wStrong + wWeak + wSep
  const selectedSize = standardRackSizes.find(s => s >= totalWidth) || null

  return {
    error: !selectedSize && totalWidth > 0,
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
 * MathJax用の数式データを生成する
 */
export function generateMathData(
  inputs: RackCalcInputs,
  result: RackCalcResult | null,
): MathStep[] {
  const mathStepData: MathStep[] = []

  const isStrong = inputs.isStrong
  const isWeak = inputs.isWeak
  const lStrongHl = hlVal(inputs.lStrong, 'L_{strong}', 0)
  const lWeakHl = hlVal(inputs.lWeak, 'L_{weak}', 0)
  const sumStrongHl = hlVal(result?.sumStrong, '\\Sigma(D+10)', 1)
  const sumWeakHl = hlVal(result?.sumWeak, '\\Sigma(D+10)', 1)

  const wStrongHl = hlVal(result?.wStrong, 'W_{strong}', 1)
  const wWeakHl = hlVal(result?.wWeak, 'W_{weak}', 1)
  const wSepHl = hlVal(inputs.separatorWidth, 'W_{sep}', 1)

  // 1. 強電ケーブルの必要幅算出
  if (isStrong) {
    const lS = inputs.lStrong ?? 1
    const divStrSym = lS > 1 ? ` \\div L_{strong}` : ``
    const divStrSub = lS > 1 ? ` \\div ${lStrongHl}` : ``
    const legendList = [
      '\\(W_{strong}\\): 強電ケーブルの必要幅 [mm]',
      '\\(D\\): ケーブル外径 [mm]',
      '※ 1.2は余裕係数、60は両端の離隔距離',
    ]

    if (lS > 1) legendList.push(`\\(L_{strong}\\): 段積み数 [段]`)

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
  }
  else {
    mathStepData.push({
      title: '① 強電ケーブルの必要幅算出',
      tex: `W_{strong} = 0 \\text{ [mm]}`,
      legend: ['強電ケーブルなし'],
    })
  }

  // 2. 弱電ケーブルの必要幅算出
  if (isWeak) {
    const lW = inputs.lWeak ?? 1
    const divStrSym = lW > 1 ? ` \\div L_{weak}` : ``
    const divStrSub = lW > 1 ? ` \\div ${lWeakHl}` : ``
    const legendList = [
      '\\(W_{weak}\\): 弱電ケーブルの必要幅 [mm]',
      '\\(D\\): ケーブル外径 [mm]',
    ]

    if (lW > 1) legendList.push(`\\(L_{weak}\\): 段積み数 [段]`)

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
      title: '② 弱電ケーブルの必要幅算出',
      tex,
      legend: legendList,
    })
  }
  else {
    mathStepData.push({
      title: '② 弱電ケーブルの必要幅算出',
      tex: `W_{weak} = 0 \\text{ [mm]}`,
      legend: ['弱電ケーブルなし'],
    })
  }

  // 3. 合計ラック幅の算出
  const legend3 = ['\\(W_{total}\\): 合計ラック幅 [mm]']

  if (isStrong) legend3.push('\\(W_{strong}\\): 強電幅 [mm]')
  if (isWeak) legend3.push('\\(W_{weak}\\): 弱電幅 [mm]')
  if (
    isStrong
    && isWeak
    && inputs.separatorWidth !== undefined
    && inputs.separatorWidth !== null
    && inputs.separatorWidth > 0
  ) {
    legend3.push('\\(W_{sep}\\): セパレータ幅 [mm]')
  }

  const rightSideSym = []
  const rightSideSub = []

  if (isStrong) {
    rightSideSym.push('W_{strong}')
    rightSideSub.push(wStrongHl)
  }
  if (isWeak) {
    rightSideSym.push('W_{weak}')
    rightSideSub.push(wWeakHl)
  }
  if (
    isStrong
    && isWeak
    && inputs.separatorWidth !== undefined
    && inputs.separatorWidth !== null
    && inputs.separatorWidth > 0
  ) {
    rightSideSym.push('W_{sep}')
    rightSideSub.push(wSepHl)
  }

  if (rightSideSym.length === 0) {
    mathStepData.push({
      title: '③ 合計ラック幅の算出',
      tex: `W_{total} = 0 \\text{ [mm]}`,
      legend: legend3,
    })

    return mathStepData
  }

  const symLine = rightSideSym.join(' + ')
  const subLine = rightSideSub.join(' + ')
  const resLine = result ? hlOk(result.totalWidth.toFixed(1)) : '\\text{---}'

  const tex3 = buildFormula(
    'W_{total}',
    symLine + ' \\\\ &= ' + subLine,
    resLine,
    'mm',
  )

  mathStepData.push({
    title: '③ 合計ラック幅の算出',
    tex: tex3,
    legend: legend3,
  })

  return mathStepData
}
