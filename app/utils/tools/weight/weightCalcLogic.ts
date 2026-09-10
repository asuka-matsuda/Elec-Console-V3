import type { CableData, DrumData } from '~/types/database'
import type { MathStep } from '~/types/tools'
import { findCableByIndexString, getEffectiveCableDiameter } from '~/utils/cable'
import { formatVal, hlAccent, hlOk } from '~/utils/math'

export interface WeightCalcInputs {
  category: string
  cableIdx: string
  L_input: number | null
  K?: number | null
}

export interface WeightCalcResult {
  error: boolean
  reason?: 'cable_not_found' | 'drum_not_found'
  cableWeight?: number
  bestDrum?: DrumData
  maxCapacityMeters?: number
  bestMathParams?: {
    m: number
    n: number
    L: number
    W2: number
    d: number
    D1: number
    D2: number
    g: number
    bendFactor: number
    minD2: number
    minDrumByWeight: DrumData | undefined
    minDrumByRadius: DrumData | undefined
  }
}

/**
 * ケーブル重量計算と最適ドラム選定を行う
 */
export function calculateWeightAndDrum(
  inputs: WeightCalcInputs,
  cableData: CableData[],
  drumData: DrumData[],
): WeightCalcResult {
  const { category, cableIdx, L_input } = inputs

  if (L_input === null) throw new Error('Invalid inputs')

  const cable = findCableByIndexString(cableIdx, cableData)

  if (!cable) return { error: true, reason: 'cable_not_found' }

  const diameter = getEffectiveCableDiameter(cable.diameter)

  const weightPerKm = Number(cable.weight)
  const cableWeight = (weightPerKm * L_input) / 1000

  let bestDrum: DrumData | null = null
  let maxCapacityMeters = 0
  let bestMathParams: WeightCalcResult['bestMathParams'] = undefined

  // Assuming voltage is stored in standard or we just use 12 by default for this simple tool.
  // The old code did `cable.voltage === '6.6kV' ? 15 : 12;`.
  // Since 'voltage' is not in our simplified CableData interface, we'll check category.
  const bendFactor = category.includes('6.6kV') ? 15 : 12
  const minD2 = bendFactor * diameter

  const minDrumByWeight = drumData.find(
    d => Number(d.max_winding_weight) >= cableWeight,
  )
  const minDrumByRadius = drumData.find(
    d => Number(d.barrel_diameter) >= minD2,
  )

  for (const drum of drumData) {
    const maxWindingWeight = Number(drum.max_winding_weight)

    if (cableWeight > maxWindingWeight) continue

    const D1 = Number(drum.flange_diameter)
    const D2 = Number(drum.barrel_diameter)
    const W2 = Number(drum.inner_width)

    if (D2 < minD2) continue

    let g: number
    const catPrefix = drum.category
    const catNumMatch = catPrefix.match(/\d+/)
    const catNum = catNumMatch ? parseInt(catNumMatch[0]) : 0

    if (catNum >= 1 && catNum <= 6) {
      g = Math.max(30, diameter)
    }
    else if (catNum >= 7 && catNum <= 13) {
      g = Math.max(40, diameter)
    }
    else if (catNum >= 14 && catNum <= 17) {
      g = Math.max(30, diameter)
    }
    else {
      g = Math.max(30, diameter)
    }

    const m = Math.floor(W2 / diameter) - 1

    if (m <= 0) continue

    const n_raw = (D1 - D2 - 2 * g) / (2 * diameter)

    if (n_raw <= 0) continue
    const n = Math.floor(n_raw)

    const capacity = Math.PI * m * n * (D2 + n * diameter) * 1e-3

    if (capacity >= L_input) {
      if (!bestDrum || Number(drum.weight) < Number(bestDrum.weight)) {
        bestDrum = drum
        maxCapacityMeters = capacity
        bestMathParams = {
          m,
          n,
          L: capacity,
          W2,
          d: diameter,
          D1,
          D2,
          g,
          bendFactor,
          minD2,
          minDrumByWeight,
          minDrumByRadius,
        }
      }
    }
  }

  if (!bestDrum) {
    return { error: true, reason: 'drum_not_found', cableWeight }
  }

  return {
    error: false,
    cableWeight,
    bestDrum,
    maxCapacityMeters,
    bestMathParams,
  }
}

/**
 * MathJax用の数式データを生成する
 */
export function generateMathData(
  inputs: WeightCalcInputs,
  result: WeightCalcResult | null,
  cableData: CableData[],
): MathStep[] {
  const L_req = formatVal(inputs.L_input, 'L_{req}', 1)

  const cable = findCableByIndexString(inputs.cableIdx, cableData)
  const d_val = cable ? getEffectiveCableDiameter(cable.diameter) : null
  const d_str = formatVal(d_val, 'd', 1)
  const w_unit = formatVal(cable ? Number(cable.weight) : null, 'W_{unit}', 1)
  const bendFactor = inputs.category.includes('6.6kV') ? 15 : 12

  // ① ケーブル重量算出と許容巻取重量
  const W_cable_sym = `\\frac{W_{unit} \\times L_{req}}{1000}`
  const W_cable_sub = `\\frac{${w_unit} \\times ${L_req}}{1000}`
  let W_cable_res = '\\text{---}'
  const drumWeightSym = 'W_{cable} &\\le W_{max}'
  let drumWeightSub = '\\text{---} \\text{ kg} &\\le \\text{---} \\text{ kg}'

  if (
    result
    && !result.error
    && result.cableWeight !== undefined
    && result.bestDrum
  ) {
    W_cable_res = result.cableWeight.toFixed(1)
    const W_max = Number(result.bestDrum.max_winding_weight)

    drumWeightSub = `${W_cable_res} \\text{ kg} &\\le ${W_max.toFixed(1)} \\text{ kg} \\quad ${hlOk('\\text{(適合)}')}`
  }
  const tex1 = `\\begin{aligned} W_{cable} &= ${W_cable_sym} \\\\ &= ${W_cable_sub} \\\\ &= ${W_cable_res} \\text{ [kg]} \\\\\\\\ ${drumWeightSym} \\\\ ${drumWeightSub} \\end{aligned}`
  const leg1 = [
    `\\(W_{cable}\\): ケーブル総重量 [kg]`,
    `\\(W_{unit}\\): 単位重量 [kg/km]`,
    `\\(L_{req}\\): 要求電線長 [m]`,
    `\\(W_{max}\\): 選定ドラムの許容巻取重量 [kg]`,
  ]

  // ② 曲げ半径判定（最小胴径）
  const minD2_sym = `${bendFactor}d`
  const minD2_sub = `${bendFactor} \\times ${d_str}`
  let minD2_res = '\\text{---}'
  const drumRadiusSym = `D_{min} &\\le D_2`
  let drumRadiusSub = `\\text{---} \\text{ mm} &\\le \\text{---} \\text{ mm}`

  if (result && !result.error && result.bestMathParams && result.bestDrum) {
    minD2_res = result.bestMathParams.minD2.toFixed(1)
    const D2 = result.bestMathParams.D2

    drumRadiusSub = `${minD2_res} \\text{ mm} &\\le ${D2.toFixed(1)} \\text{ mm} \\quad ${hlOk('\\text{(適合)}')}`
  }
  const tex2 = `\\begin{aligned} D_{min} &= ${minD2_sym} \\\\ &= ${minD2_sub} \\\\ &= ${minD2_res} \\text{ [mm]} \\\\\\\\ ${drumRadiusSym} \\\\ ${drumRadiusSub} \\end{aligned}`
  const leg2 = [
    `\\(D_{min}\\): 最小許容胴径 [mm]`,
    `\\(d\\): ケーブル外径 [mm]`,
    `\\(D_2\\): 選定ドラムの胴径 [mm]`,
  ]

  // ③ 容量判定（巻き込み可能条長）
  let tex3 = `\\begin{aligned} m &= \\left\\lfloor \\frac{W_2}{d} \\right\\rfloor - 1 \\\\ &= \\text{---} \\text{ [条]} \\\\[6pt] n &= \\left\\lfloor \\frac{D_1 - D_2 - 2g}{2d} \\right\\rfloor \\\\ &= \\text{---} \\text{ [層]} \\\\[6pt] L_{cap} &= \\pi m n (D_2 + n d) \\times 10^{-3} \\\\ &= \\text{---} \\\\ &= \\text{---} \\text{ [m]} \\\\[8pt] L_{req} &\\le L_{cap} \\\\ \\text{---} \\text{ m} &\\le \\text{---} \\text{ m} \\end{aligned}`
  const leg3 = [
    `\\(m\\): 1層にならぶ条数 [条]`,
    `\\(n\\): 巻取層数 [層]`,
    `\\(L_{cap}\\): 巻取可能長 [m]`,
    `\\(W_2\\): ドラム内幅 [mm]`,
    `\\(d\\): ケーブル外径 [mm]`,
    `\\(D_1\\): つば外径 [mm]`,
    `\\(D_2\\): 胴径 [mm]`,
    `\\(g\\): つば余裕 [mm]`,
    `\\(L_{req}\\): 要求長 [m]`,
  ]

  if (result && !result.error && result.bestMathParams) {
    const { m, n, L, W2, D1, D2, g } = result.bestMathParams
    const W2_str = formatVal(W2, 'W_2', 1)
    const D1_str = formatVal(D1, 'D_1', 1)
    const D2_str = formatVal(D2, 'D_2', 1)
    const g_str = formatVal(g, 'g', 1)

    const m_sub = `\\left\\lfloor \\frac{${W2_str}}{${d_str}} \\right\\rfloor - 1`
    const n_sub = `\\left\\lfloor \\frac{${D1_str} - ${D2_str} - 2 \\times ${g_str}}{2 \\times ${d_str}} \\right\\rfloor`
    const L_cap_sub = `\\pi \\times ${m} \\times ${n} (${D2_str} + ${n} \\times ${d_str}) \\times 10^{-3}`
    const capCheckSub = `${L_req} \\text{ m} &\\le ${L.toFixed(1)} \\text{ m} \\quad ${hlOk('\\text{(適合)}')}`

    tex3 = `\\begin{aligned} m &= \\left\\lfloor \\frac{W_2}{d} \\right\\rfloor - 1 \\\\ &= ${m_sub} \\\\ &= ${m} \\text{ [条]} \\\\[6pt] n &= \\left\\lfloor \\frac{D_1 - D_2 - 2g}{2d} \\right\\rfloor \\\\ &= ${n_sub} \\\\ &= ${n} \\text{ [層]} \\\\[6pt] L_{cap} &= \\pi m n (D_2 + n d) \\times 10^{-3} \\\\ &= ${L_cap_sub} \\\\ &= ${L.toFixed(1)} \\text{ [m]} \\\\[8pt] L_{req} &\\le L_{cap} \\\\ ${capCheckSub} \\end{aligned}`
  }

  // ④ 総合選定結果
  let tex4 = `\\begin{aligned} \\text{選定ドラム:} &\\quad \\text{【 --- 】} \\\\ \\text{総重量 } W_{total} &= W_{cable} + W_{drum} \\\\ &= \\text{---} \\text{ [kg]} \\end{aligned}`
  const leg4 = [
    `\\(W_{total}\\): 総重量 (ケーブル+ドラム) [kg]`,
    `\\(W_{cable}\\): ケーブル重量 [kg]`,
    `\\(W_{drum}\\): ドラム自重 [kg]`,
  ]

  if (
    result
    && !result.error
    && result.bestDrum
    && result.cableWeight !== undefined
  ) {
    const drum = result.bestDrum
    const drumWeight = Number(drum.weight)
    const totalWeight = result.cableWeight + drumWeight
    const minD2Val = (result.bestMathParams?.minD2 ?? 0).toFixed(1)
    const capVal = result.maxCapacityMeters?.toFixed(1) ?? '0'
    const drumBadge = hlAccent(`\\text{【 ${drum.id} 】}`)

    tex4 = `\\begin{aligned} \\text{選定ドラム:} &\\quad ${drumBadge} \\\\\\\\ \\text{選定判定:} &\\quad ① \\text{許容重量 } (${result.cableWeight.toFixed(1)} \\le ${Number(drum.max_winding_weight).toFixed(0)} \\text{ kg}) \\quad ${hlOk('\\text{適合}')} \\\\ &\\quad ② \\text{最小胴径 } (${minD2Val} \\le ${Number(drum.barrel_diameter).toFixed(0)} \\text{ mm}) \\quad ${hlOk('\\text{適合}')} \\\\ &\\quad ③ \\text{巻取長 } (${inputs.L_input ?? 0} \\le ${capVal} \\text{ m}) \\quad ${hlOk('\\text{適合}')} \\\\\\\\ \\text{総重量 } W_{total} &= W_{cable} + W_{drum} \\\\ &= ${result.cableWeight.toFixed(1)} + ${drumWeight.toFixed(1)} \\\\ &= ${totalWeight.toFixed(1)} \\text{ [kg]} \\end{aligned}`
  }

  return [
    { title: '① 重量判定（許容巻取重量）', tex: tex1, legend: leg1 },
    { title: '② 曲げ半径判定（最小胴径）', tex: tex2, legend: leg2 },
    { title: '③ 容量判定（巻き込み可能条長）', tex: tex3, legend: leg3 },
    { title: '④ 総合選定結果（適合ドラム選定）', tex: tex4, legend: leg4 },
  ]
}
