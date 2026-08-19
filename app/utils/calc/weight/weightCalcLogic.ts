import type { CableData, ConduitData, DrumData } from '~/types/database';
;

export interface WeightCalcInputs {
  category: string;
  size: string;
  cores: string;
  L_input: number;
  K: number;
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
  const { category, size, cores, L_input, K } = inputs;

  const cable = cableData.find(
    (c) => c.category === category && c.cores === cores && c.size === size
  );
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
