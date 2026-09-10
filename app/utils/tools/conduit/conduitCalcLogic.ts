import type { CableData, ConduitData } from '~/types/database'
import type { CableInputItem, MathStep } from '~/types/tools'
import { findCableByIndexString, getEffectiveCableDiameter } from '~/utils/cable'
import { buildFormula, formatVal, hlAccent, hlOk } from '~/utils/math'

export type CableInput = CableInputItem

export interface CableDetail {
  input: CableInput
  def: CableData
  effectiveDiameter: number
  singleArea: number
  subTotalArea: number
}

export interface ConduitCalcResult {
  success: boolean
  partial: boolean
  error?: string
  message?: string

  conduit32?: ConduitData
  fill32?: number
  allowable32?: number
  isOversize32?: boolean

  conduit48?: ConduitData
  fill48?: number
  allowable48?: number
  isOversize48?: boolean

  customFillRate?: number
  conduitCustom?: ConduitData
  fillCustom?: number
  allowableCustom?: number
  isOversizeCustom?: boolean

  isSameSize?: boolean

  totalArea: number
  cableDetails: CableDetail[]
}

/**
 * ケーブル外径から1本あたりの断面積を計算する
 * VVFなどの平形（6.2×9.4 等）の場合は長径を直径として計算する（内線規程）
 */
export function calculateCableArea(diameterStr: string | number): number {
  const diameter = getEffectiveCableDiameter(diameterStr)

  if (diameter <= 0) return 0

  const radius = diameter / 2

  return radius * radius * Math.PI
}

/**
 * 入力されたケーブル群と配管種類から、最適な配管サイズを選定する
 */
export function calculateConduitSize(
  conduitCategory: string,
  inputCables: CableInput[],
  conduitData: ConduitData[],
  cableData: CableData[],
  customFillRateInput?: number | null,
): ConduitCalcResult {
  if (!inputCables || inputCables.length === 0) {
    return {
      success: false,
      partial: false,
      totalArea: 0,
      cableDetails: [],
      error: 'INVALID_INPUT',
      message: '入力が不足しています',
    }
  }

  const customFillRate
    = customFillRateInput !== null
      && customFillRateInput !== undefined
      && !isNaN(customFillRateInput)
      && customFillRateInput > 0
      ? Number(customFillRateInput)
      : 80

  let totalArea = 0
  let totalCount = 0
  const cableDetails: CableDetail[] = []

  // 選択された各ケーブルの外径から断面積を算出し、全体の総断面積を求める
  for (const input of inputCables) {
    if (input.count === null || isNaN(input.count) || input.count <= 0)
      continue

    const cableDef = findCableByIndexString(input.cableIdx, cableData)

    if (!cableDef) {
      // 途中のデータなどが含まれている場合
      continue
    }

    const diameter = getEffectiveCableDiameter(cableDef.diameter)
    const singleArea = calculateCableArea(cableDef.diameter)
    const count = input.count || 0

    if (count <= 0) continue
    const subTotalArea = singleArea * count

    totalArea += subTotalArea
    totalCount += count

    cableDetails.push({
      input,
      def: cableDef,
      effectiveDiameter: diameter,
      singleArea,
      subTotalArea,
    })
  }

  if (totalCount === 0) {
    return {
      success: false,
      partial: true,
      totalArea: 0,
      cableDetails: [],
      error: 'ZERO_CABLES',
      message: 'ケーブルの条数が0です',
    }
  }

  if (!conduitCategory) {
    return {
      success: false,
      partial: true,
      totalArea,
      cableDetails,
    }
  }

  // 内線規程に基づき、異なるケーブル混在時(32%)と同一ケーブル時(48%)、およびユーザー設定占積率で最適な配管サイズを選定する
  const targetConduits = conduitData
    .filter(c => c.category === conduitCategory)
    .sort((a, b) => Number(a.innerDiameter) - Number(b.innerDiameter))

  if (targetConduits.length === 0) {
    return {
      success: false,
      partial: false,
      totalArea,
      cableDetails,
      error: 'CONDUIT_NOT_FOUND',
      message: '指定された配管のデータがありません',
    }
  }

  const largest = targetConduits[targetConduits.length - 1]

  function findOptimalConduitByAllowable(
    conduits: ConduitData[],
    requiredArea: number,
    getAllowable: (c: ConduitData) => number,
  ) {
    for (const conduit of conduits) {
      const allowable = getAllowable(conduit)

      if (requiredArea <= allowable) {
        return {
          conduit,
          fillPercent: (requiredArea / Number(conduit.area)) * 100,
          allowable,
          isOversize: false,
        }
      }
    }

    const largestAllowable = getAllowable(largest!)

    return {
      conduit: largest!,
      fillPercent: (requiredArea / Number(largest!.area)) * 100,
      allowable: largestAllowable,
      isOversize: requiredArea > largestAllowable,
    }
  }

  const result32 = findOptimalConduitByAllowable(
    targetConduits,
    totalArea,
    c => Number(c.area32),
  )
  const result48 = findOptimalConduitByAllowable(
    targetConduits,
    totalArea,
    c => Number(c.area48),
  )
  const resultCustom = findOptimalConduitByAllowable(
    targetConduits,
    totalArea,
    c => Number(c.area) * (customFillRate / 100),
  )

  const uniqueDiameters = new Set(cableDetails.map(c => c.effectiveDiameter))
  const isSameSize = uniqueDiameters.size === 1

  return {
    success: true,
    partial: false,
    conduit32: result32.conduit,
    fill32: result32.fillPercent,
    allowable32: result32.allowable,
    isOversize32: result32.isOversize,

    conduit48: result48.conduit,
    fill48: result48.fillPercent,
    allowable48: result48.allowable,
    isOversize48: result48.isOversize,

    customFillRate,
    conduitCustom: resultCustom.conduit,
    fillCustom: resultCustom.fillPercent,
    allowableCustom: resultCustom.allowable,
    isOversizeCustom: resultCustom.isOversize,

    isSameSize,

    totalArea,
    cableDetails,
  }
}

/**
 * MathJax用の数式データを生成する
 */
export function generateMathData(
  conduitCategory: string,
  inputCables: CableInput[],
  res: ConduitCalcResult | null,
): MathStep[] {
  const rowCount = inputCables.length || 1
  const allCablesKnown = res?.success && !res.partial
  const totalKnownArea = res?.totalArea || 0

  const formulaVarStr = rowCount === 1 ? 'A_1' : '\\sum A_k'
  let substStr = ''
  const cableRowsTex: string[] = []

  if (res?.cableDetails && res.cableDetails.length > 0) {
    if (res.cableDetails.length === 1 && res.cableDetails[0]) {
      const c = res.cableDetails[0]
      const dVal = c.effectiveDiameter.toFixed(1)
      const count = c.input.count || 1

      substStr = `\\frac{\\pi \\times (${dVal})^2}{4} \\times ${count} = ${c.subTotalArea.toFixed(1)}`
    }
    else {
      res.cableDetails.forEach((c, i) => {
        const dVal = c.effectiveDiameter.toFixed(1)
        const aVal = c.singleArea.toFixed(1)
        const count = c.input.count || 1

        cableRowsTex.push(
          `A_{${i + 1}} &= \\frac{\\pi \\times (${dVal})^2}{4} \\times ${count} = ${aVal} \\times ${count} = ${c.subTotalArea.toFixed(1)} \\text{ [mm}^2\\text{]}`,
        )
      })
      const sumTerms = res.cableDetails.map((_, i) => `A_{${i + 1}}`).join(' + ')
      const numTerms = res.cableDetails.map(c => c.subTotalArea.toFixed(1)).join(' + ')

      substStr = `${sumTerms} \\\\ &= ${numTerms}`
    }
  }

  const resultStr1 = allCablesKnown
    ? totalKnownArea.toFixed(1)
    : '\\text{---}'

  let formula1: string

  if (cableRowsTex.length > 0) {
    formula1 = `\\begin{aligned} ${cableRowsTex.join(' \\\\ ')} \\\\\\\\ A_{total} &= ${substStr} \\\\ &= ${resultStr1} \\text{ [mm}^2\\text{]} \\end{aligned}`
  }
  else {
    formula1 = buildFormula(
      'A_{total}',
      substStr ? `${formulaVarStr} \\\\ &= ${substStr}` : formulaVarStr,
      resultStr1,
      'mm^2',
    )
  }

  const rateStr = res?.customFillRate ? `${res.customFillRate}` : '80'
  const customRate = res?.customFillRate ?? 80
  const totalAreaStr = formatVal(totalKnownArea, 'A_{total}', 1)

  let formula2 = `\\begin{aligned} &\\textbf{【 32\\%以下基準（異なる太さの電線等） 】} \\\\ &\\quad \\text{選定サイズ:} \\quad \\text{【 --- 】} \\\\ &\\quad \\text{判定条件:} \\quad A_{\\text{pipe}} \\times 0.32 \\ge A_{total} \\\\[6pt] &\\textbf{【 48\\%以下基準（同じ太さの電線等） 】} \\\\ &\\quad \\text{選定サイズ:} \\quad \\text{【 --- 】} \\\\ &\\quad \\text{判定条件:} \\quad A_{\\text{pipe}} \\times 0.48 \\ge A_{total} \\\\[6pt] &\\textbf{【 指定占積率(${rateStr}\\%以下) 】} \\\\ &\\quad \\text{選定サイズ:} \\quad \\text{【 --- 】} \\\\ &\\quad \\text{判定条件:} \\quad A_{\\text{pipe}} \\times ${(customRate / 100).toFixed(2)} \\ge A_{total} \\end{aligned}`

  if (
    allCablesKnown
    && conduitCategory
    && res?.conduit32
    && res?.conduit48
    && res?.conduitCustom
  ) {
    const pipe32Area = Number(res.conduit32.area).toFixed(1)
    const pipe32InnerD = Number(res.conduit32.innerDiameter).toFixed(1)
    const allow32Str = res.allowable32 !== undefined ? res.allowable32.toFixed(1) : '---'
    const fill32Str = res.fill32 !== undefined ? res.fill32.toFixed(1) : '---'

    const pipe48Area = Number(res.conduit48.area).toFixed(1)
    const pipe48InnerD = Number(res.conduit48.innerDiameter).toFixed(1)
    const allow48Str = res.allowable48 !== undefined ? res.allowable48.toFixed(1) : '---'
    const fill48Str = res.fill48 !== undefined ? res.fill48.toFixed(1) : '---'

    const pipeCustomArea = Number(res.conduitCustom.area).toFixed(1)
    const pipeCustomInnerD = Number(res.conduitCustom.innerDiameter).toFixed(1)
    const allowCustomStr = res.allowableCustom !== undefined ? res.allowableCustom.toFixed(1) : '---'
    const fillCustomStr = res.fillCustom !== undefined ? res.fillCustom.toFixed(1) : '---'

    const size32Badge = hlAccent(`\\text{【 ${res.conduit32.size} 】}`)
    const size48Badge = hlAccent(`\\text{【 ${res.conduit48.size} 】}`)
    const sizeCustomBadge = hlAccent(`\\text{【 ${res.conduitCustom.size} 】}`)
    const passTag = hlOk('\\text{(適合)}')

    formula2 = `\\begin{aligned} &\\textbf{【 32\\%以下基準（異なる太さの電線等） 】} \\\\ &\\quad \\text{選定サイズ:} \\quad ${size32Badge} \\\\ &\\quad \\text{管スペック:} \\quad \\text{内径 } ${pipe32InnerD} \\text{ mm} \\quad (A_{\\text{pipe}} = ${pipe32Area} \\text{ mm}^2) \\\\ &\\quad \\text{許容断面積:} \\quad A_{allow} = ${pipe32Area} \\times 0.32 = ${allow32Str} \\text{ mm}^2 \\\\ &\\qquad (${allow32Str} \\text{ mm}^2 \\ge ${totalAreaStr} \\text{ mm}^2 \\quad ${passTag}) \\\\ &\\quad \\text{実計算占積率:} \\quad \\eta = \\frac{${totalAreaStr}}{${pipe32Area}} \\times 100 = ${fill32Str}\\% \\\\ &\\qquad (${fill32Str}\\% \\le 32.0\\% \\quad ${passTag}) \\\\[8pt] &\\textbf{【 48\\%以下基準（同じ太さの電線等） 】} \\\\ &\\quad \\text{選定サイズ:} \\quad ${size48Badge} \\\\ &\\quad \\text{管スペック:} \\quad \\text{内径 } ${pipe48InnerD} \\text{ mm} \\quad (A_{\\text{pipe}} = ${pipe48Area} \\text{ mm}^2) \\\\ &\\quad \\text{許容断面積:} \\quad A_{allow} = ${pipe48Area} \\times 0.48 = ${allow48Str} \\text{ mm}^2 \\\\ &\\qquad (${allow48Str} \\text{ mm}^2 \\ge ${totalAreaStr} \\text{ mm}^2 \\quad ${passTag}) \\\\ &\\quad \\text{実計算占積率:} \\quad \\eta = \\frac{${totalAreaStr}}{${pipe48Area}} \\times 100 = ${fill48Str}\\% \\\\ &\\qquad (${fill48Str}\\% \\le 48.0\\% \\quad ${passTag}) \\\\[8pt] &\\textbf{【 指定占積率(${rateStr}\\%以下) 】} \\\\ &\\quad \\text{選定サイズ:} \\quad ${sizeCustomBadge} \\\\ &\\quad \\text{管スペック:} \\quad \\text{内径 } ${pipeCustomInnerD} \\text{ mm} \\quad (A_{\\text{pipe}} = ${pipeCustomArea} \\text{ mm}^2) \\\\ &\\quad \\text{許容断面積:} \\quad A_{allow} = ${pipeCustomArea} \\times ${(customRate / 100).toFixed(2)} = ${allowCustomStr} \\text{ mm}^2 \\\\ &\\qquad (${allowCustomStr} \\text{ mm}^2 \\ge ${totalAreaStr} \\text{ mm}^2 \\quad ${passTag}) \\\\ &\\quad \\text{実計算占積率:} \\quad \\eta = \\frac{${totalAreaStr}}{${pipeCustomArea}} \\times 100 = ${fillCustomStr}\\% \\\\ &\\qquad (${fillCustomStr}\\% \\le ${customRate}.0\\% \\quad ${passTag}) \\end{aligned}`
  }

  return [
    {
      title: '① ケーブルの断面積算出',
      tex: formula1,
      legend: [
        `\\( A_{total} \\): ケーブル合計断面積 [mm²]`,
        `\\( A_k \\): 各条の断面積小計 [mm²]`,
        `\\( d \\): ケーブル仕上外径 [mm]`,
      ],
    },
    {
      title: '② 電線管サイズの選定と占積率判定',
      tex: formula2,
      legend: [
        `\\( A_{\\text{pipe}} \\): 電線管の内断面積 [mm²]`,
        `\\( A_{allow} \\): 許容断面積 [mm²]`,
        `\\( \\eta \\): 実計算占積率 [\\%]`,
        `\\( A_{total} \\): ケーブル合計断面積 [mm²]`,
      ],
    },
  ]
}
