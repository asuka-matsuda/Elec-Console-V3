import type { CableData, ConduitData, DrumData } from '~/types/database';
;

export interface CableInput {
  id: string; // for UI tracking
  category: string;
  size: string;
  cores: string;
  count: number;
}

export interface CableDetail {
  input: CableInput;
  def: CableData;
  effectiveDiameter: number;
  singleArea: number;
  subTotalArea: number;
}

export interface ConduitCalcResult {
  success: boolean;
  partial: boolean;
  error?: string;
  message?: string;
  
  conduit32?: ConduitData;
  fill32?: number;
  allowable32?: number;
  isOversize32?: boolean;
  
  conduit48?: ConduitData;
  fill48?: number;
  allowable48?: number;
  isOversize48?: boolean;
  
  totalArea: number;
  cableDetails: CableDetail[];
}

/**
 * ケーブル外径から1本あたりの断面積を計算する
 * VVFなどの平形（6.2×9.4 等）の場合は長径を直径として計算する（内線規程）
 */
export function calculateCableArea(diameterStr: string): number {
  if (!diameterStr) return 0;

  let diameter = 0;
  if (diameterStr.includes('×')) {
    // VVFなどの平形ケーブルにおいては、安全側の設計とするため最大寸法を長径として扱う
    const parts = diameterStr.split('×').map((s: any) => parseFloat(s.trim()));
    diameter = Math.max(...parts);
  } else {
    diameter = parseFloat(diameterStr);
  }

  if (isNaN(diameter) || diameter <= 0) return 0;

  const radius = diameter / 2;
  return radius * radius * Math.PI;
}

/**
 * 入力されたケーブル群と配管種類から、最適な配管サイズを選定する
 */
export function calculateConduitSize(
  conduitCategory: string,
  inputCables: CableInput[],
  conduitData: ConduitData[],
  cableData: CableData[]
): ConduitCalcResult {
  if (!inputCables || inputCables.length === 0) {
    return { success: false, partial: false, totalArea: 0, cableDetails: [], error: 'INVALID_INPUT', message: '入力が不足しています' };
  }

  let totalArea = 0;
  let totalCount = 0;
  const cableDetails: CableDetail[] = [];

  // 選択された各ケーブルの外径から断面積を算出し、全体の総断面積を求める
  for (const input of inputCables) {
    if (isNaN(input.count) || input.count <= 0) continue;

    const cableDef = cableData.find(
      (c) => c.category === input.category && c.cores === input.cores && c.size === input.size
    );

    if (!cableDef) {
      // 途中のデータなどが含まれている場合
      continue;
    }

    let diameter = 0;
    if (cableDef.diameter.includes('×')) {
      diameter = Math.max(...cableDef.diameter.split('×').map((s: any) => parseFloat(s.trim())));
    } else {
      diameter = parseFloat(cableDef.diameter);
    }

    const singleArea = calculateCableArea(cableDef.diameter);
    const subTotalArea = singleArea * input.count;

    totalArea += subTotalArea;
    totalCount += input.count;

    cableDetails.push({
      input,
      def: cableDef,
      effectiveDiameter: diameter,
      singleArea,
      subTotalArea
    });
  }

  if (totalCount === 0) {
    return { success: false, partial: true, totalArea: 0, cableDetails: [], error: 'ZERO_CABLES', message: 'ケーブルの本数が0です' };
  }

  if (!conduitCategory) {
    return {
      success: false,
      partial: true,
      totalArea,
      cableDetails
    };
  }

  // 内線規程に基づき、異なるケーブル混在時(32%)と同一ケーブル時(48%)の両方の基準で最適な配管サイズを選定する
  const targetConduits = conduitData
    .filter((c) => c.category === conduitCategory)
    .sort((a, b) => parseFloat(a.innerDiameter) - parseFloat(b.innerDiameter));

  if (targetConduits.length === 0) {
    return { success: false, partial: false, totalArea, cableDetails, error: 'CONDUIT_NOT_FOUND', message: '指定された配管のデータがありません' };
  }

  const largest = targetConduits[targetConduits.length - 1];

  function findOptimalConduit(conduits: ConduitData[], requiredArea: number, ruleField: 'area32' | 'area48') {
    for (const conduit of conduits) {
      const allowable = parseFloat(conduit[ruleField]);
      if (requiredArea <= allowable) {
        return {
          conduit,
          fillPercent: (requiredArea / parseFloat(conduit.area)) * 100,
          allowable,
          isOversize: false
        };
      }
    }
    return {
      conduit: largest!,
      fillPercent: (requiredArea / parseFloat(largest!.area)) * 100,
      allowable: parseFloat(largest![ruleField]),
      isOversize: requiredArea > parseFloat(largest![ruleField])
    };
  }

  const result32 = findOptimalConduit(targetConduits, totalArea, 'area32');
  const result48 = findOptimalConduit(targetConduits, totalArea, 'area48');

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
    
    totalArea,
    cableDetails
  };
}
