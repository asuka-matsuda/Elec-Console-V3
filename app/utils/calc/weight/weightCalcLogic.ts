import type { CableData, ConduitData, DrumData } from '~/types/database';
import type { MathStep } from '~/components/AppMathBasis.vue';

export interface WeightCalcInputs {
  category: string;
  cableIdx: string;
  L_input: number | null;
  K: number | null;
}

export interface WeightCalcResult {
  error: boolean;
  reason?: 'cable_not_found' | 'drum_not_found';
  cableWeight?: number;
  bestDrum?: DrumData;
  maxCapacityMeters?: number;
  bestMathParams?: {
    m: number;
    n: number;
    L: number;
    K: number;
    W2: number;
    d: number;
    D1: number;
    D2: number;
    g: number;
    bendFactor: number;
    minD2: number;
    minDrumByWeight: DrumData | undefined;
    minDrumByRadius: DrumData | undefined;
  };
}

function getMaxCableDiameter(diameterStr: string): number {
  if (!diameterStr) return 0;
  if (diameterStr.includes('×')) {
    const parts = diameterStr.split('×').map((s) => parseFloat(s.trim()));
    return Math.max(...parts);
  }
  return parseFloat(diameterStr);
}

/**
 * ケーブル重量計算と最適ドラム選定を行う
 */
export function calculateWeightAndDrum(
  inputs: WeightCalcInputs,
  cableData: CableData[],
  drumData: DrumData[]
): WeightCalcResult {
  const { category, cableIdx, L_input, K } = inputs;
  if (L_input === null || K === null) throw new Error("Invalid inputs");

  let cable: CableData | undefined;
  if (cableIdx && cableIdx.startsWith('idx_')) {
    const idx = parseInt(cableIdx.replace('idx_', ''), 10);
    cable = cableData[idx];
  }
  if (!cable) return { error: true, reason: 'cable_not_found' };

  const diameter = getMaxCableDiameter(cable.diameter);

  const weightPerKm = parseFloat(cable.weight);
  const cableWeight = (weightPerKm * L_input) / 1000;

  let bestDrum: DrumData | null = null;
  let maxCapacityMeters = 0;
  let bestMathParams: WeightCalcResult['bestMathParams'] = undefined;

  // Assuming voltage is stored in standard or we just use 12 by default for this simple tool.
  // The old code did `cable.voltage === '6.6kV' ? 15 : 12;`.
  // Since 'voltage' is not in our simplified CableData interface, we'll check category.
  const bendFactor = category.includes('6.6kV') ? 15 : 12;
  const minD2 = bendFactor * diameter;

  const minDrumByWeight = drumData.find((d) => parseFloat(d.max_winding_weight) >= cableWeight);
  const minDrumByRadius = drumData.find((d) => parseFloat(d.barrel_diameter) >= minD2);

  for (const drum of drumData) {
    const maxWindingWeight = parseFloat(drum.max_winding_weight);
    if (cableWeight > maxWindingWeight) continue;

    const D1 = parseFloat(drum.flange_diameter);
    const D2 = parseFloat(drum.barrel_diameter);
    const W2 = parseFloat(drum.inner_width);

    if (D2 < minD2) continue;

    let g = 0;
    const catPrefix = drum.category;
    const catNumMatch = catPrefix.match(/\d+/);
    const catNum = catNumMatch ? parseInt(catNumMatch[0]) : 0;

    if (catNum >= 1 && catNum <= 6) {
      g = Math.max(30, diameter);
    } else if (catNum >= 7 && catNum <= 13) {
      g = Math.max(40, diameter);
    } else if (catNum >= 14 && catNum <= 17) {
      g = Math.max(30, diameter);
    } else {
      g = Math.max(30, diameter);
    }

    const m = Math.floor((K * W2) / diameter);
    if (m <= 0) continue;

    const n_raw = (D1 - D2 - 2 * g) / (2 * diameter);
    if (n_raw <= 0) continue;
    const n = Math.floor(n_raw);

    const capacity = Math.PI * m * n * (D2 + n * diameter) * 1e-3;

    if (capacity >= L_input) {
      if (!bestDrum || parseFloat(drum.weight) < parseFloat(bestDrum.weight)) {
        bestDrum = drum;
        maxCapacityMeters = capacity;
        bestMathParams = {
          m,
          n,
          L: capacity,
          K,
          W2,
          d: diameter,
          D1,
          D2,
          g,
          bendFactor,
          minD2,
          minDrumByWeight,
          minDrumByRadius
        };
      }
    }
  }

  if (!bestDrum) {
    return { error: true, reason: 'drum_not_found', cableWeight };
  }

  return {
    error: false,
    cableWeight,
    bestDrum,
    maxCapacityMeters,
    bestMathParams
  };
}

import { hlVal, hlOk, hlNg, buildFormula } from '~/utils/mathUtils';

/**
 * MathJax用の数式データを生成する
 */
export function generateMathData(
  inputs: WeightCalcInputs,
  result: WeightCalcResult | null,
  cableData: CableData[]
): MathStep[] {
  const L_req_hl = hlVal(inputs.L_input, 'L_{req}', 1);
  
  let cable: CableData | undefined;
  if (inputs.cableIdx && inputs.cableIdx.startsWith('idx_')) {
    const idx = parseInt(inputs.cableIdx.replace('idx_', ''), 10);
    cable = cableData[idx];
  }
  const d_val = cable ? getMaxCableDiameter(cable.diameter) : null;
  const d_hl = hlVal(d_val, 'd', 1);
  const w_unit_hl = hlVal(cable ? parseFloat(cable.weight) : null, 'W_{unit}', 1);
  const bendFactor = inputs.category.includes('6.6kV') ? 15 : 12;

  // ① ケーブル重量算出と許容巻取重量
  const W_cable_sym = `\\frac{W_{unit} \\times L_{req}}{1000}`;
  const W_cable_sub = `\\frac{${w_unit_hl} \\times ${L_req_hl}}{1000}`;
  let W_cable_res = '\\text{---}';
  let drumWeightSym = 'W_{cable} &\\le W_{max}';
  let drumWeightSub = '\\text{---} \\text{ kg} &\\le \\text{---} \\text{ kg}';

  if (result && !result.error && result.cableWeight !== undefined && result.bestDrum) {
    W_cable_res = result.cableWeight.toFixed(1);
    const W_max = parseFloat(result.bestDrum.max_winding_weight);
    drumWeightSub = `${hlVal(result.cableWeight, 'W_{cable}', 1)} \\text{ kg} &\\le ${hlOk(W_max.toFixed(1))} \\text{ kg}`;
    drumWeightSub += ` \\\\ &\\rightarrow \\text{【 } ${hlOk(result.bestDrum.id)} \\text{ 】}`;
  }
  const tex1 = `\\begin{aligned} W_{cable} &= ${W_cable_sym} \\\\ &= ${W_cable_sub} \\\\ &= ${W_cable_res} \\text{ [kg]} \\\\\\\\ ${drumWeightSym} \\\\ ${drumWeightSub} \\end{aligned}`;
  const leg1 = [
    `\\(W_{cable}\\): ケーブル重量 [kg]`,
    `\\(W_{unit}\\): 単位重量 [kg/km]`,
    `\\(L_{req}\\): 要求長 [m]`,
    `\\(W_{max}\\): 許容巻取重量 [kg]`
  ];

  // ② 曲げ半径判定（最小胴径）
  const minD2_sym = `${bendFactor}d`;
  const minD2_sub = `${bendFactor} \\times ${d_hl}`;
  let minD2_res = '\\text{---}';
  let drumRadiusSym = `D_{min} &\\le D_2`;
  let drumRadiusSub = `\\text{---} \\text{ mm} &\\le \\text{---} \\text{ mm}`;

  if (result && !result.error && result.bestMathParams && result.bestDrum) {
    minD2_res = result.bestMathParams.minD2.toFixed(1);
    const D2 = result.bestMathParams.D2;
    drumRadiusSub = `${hlVal(result.bestMathParams.minD2, 'D_{min}', 1)} \\text{ mm} &\\le ${hlOk(D2.toFixed(1))} \\text{ mm}`;
  }
  const tex2 = `\\begin{aligned} D_{min} &= ${minD2_sym} \\\\ &= ${minD2_sub} \\\\ &= ${minD2_res} \\text{ [mm]} \\\\\\\\ ${drumRadiusSym} \\\\ ${drumRadiusSub} \\end{aligned}`;
  const leg2 = [
    `\\(D_{min}\\): 最小曲げ半径(胴径換算) [mm]`,
    `\\(d\\): ケーブル外径 [mm]`,
    `\\(D_2\\): 選定ドラムの胴径 [mm]`
  ];

  // ③ 容量判定（巻き込み可能条長）
  let tex3 = `\\begin{aligned} L_{cap} &= \\pi m n (D_2 + n d) \\times 10^{-3} \\\\ &= \\text{---} \\\\ &= \\text{---} \\text{ [m]} \\\\\\\\ L_{req} &\\le L_{cap} \\\\ \\text{---} \\text{ m} &\\le \\text{---} \\text{ m} \\end{aligned}`;
  const leg3 = [
    `\\(L_{cap}\\): 巻取可能長 [m]`,
    `\\(m\\): 1層にならぶ条数 [条]`,
    `\\(n\\): 層数 [層]`
  ];

  if (result && !result.error && result.bestMathParams) {
    const { m, n, L, D2 } = result.bestMathParams;
    const m_hl = hlVal(m, 'm', 0);
    const n_hl = hlVal(n, 'n', 0);
    const D2_hl = hlVal(D2, 'D_2', 1);
    
    const L_cap_sub = `\\pi \\times ${m_hl} \\times ${n_hl} (${D2_hl} + ${n_hl} \\times ${d_hl}) \\times 10^{-3}`;
    const capCheckSub = `${L_req_hl} \\text{ m} &\\le ${hlOk(L.toFixed(1))} \\text{ m}`;
    tex3 = `\\begin{aligned} L_{cap} &= \\pi m n (D_2 + n d) \\times 10^{-3} \\\\ &= ${L_cap_sub} \\\\ &= ${L.toFixed(1)} \\text{ [m]} \\\\\\\\ L_{req} &\\le L_{cap} \\\\ ${capCheckSub} \\end{aligned}`;
  }

  return [
    { title: '① 重量判定（許容巻取重量）', tex: tex1, legend: leg1 },
    { title: '② 曲げ半径判定（最小胴径）', tex: tex2, legend: leg2 },
    { title: '③ 容量判定（巻き込み可能条長）', tex: tex3, legend: leg3 }
  ];
}
