import type { CableData, ConduitData } from '~/types/database';
import type { MathStep } from '~/components/ui/AppMathBasis.vue';

import { hlVal, hlOk, buildFormula } from '~/utils/math';

export interface CableInput {
  id: string; // for UI tracking
  category: string;
  cableIdx: string;
  count: number | null;
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

  let diameter: number;
  if (diameterStr.includes('×')) {
    // VVFなどの平形ケーブルにおいては、安全側の設計とするため最大寸法を長径として扱う
    const parts = diameterStr.split('×').map((s: string) => parseFloat(s.trim()));
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
    if (input.count === null || isNaN(input.count) || input.count <= 0) continue;

    let cableDef: CableData | undefined;
    if (input.cableIdx && input.cableIdx.startsWith('idx_')) {
      const idx = parseInt(input.cableIdx.replace('idx_', ''), 10);
      cableDef = cableData[idx];
    }

    if (!cableDef) {
      // 途中のデータなどが含まれている場合
      continue;
    }

    let diameter: number;
    if (cableDef.diameter.includes('×')) {
      diameter = Math.max(...cableDef.diameter.split('×').map((s: string) => parseFloat(s.trim())));
    } else {
      diameter = parseFloat(cableDef.diameter);
    }

    const singleArea = calculateCableArea(cableDef.diameter);
    const count = input.count || 0;
    if (count <= 0) continue;
    const subTotalArea = singleArea * count;

    totalArea += subTotalArea;
    totalCount += count;

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
    .sort((a, b) => Number(a.innerDiameter) - Number(b.innerDiameter));

  if (targetConduits.length === 0) {
    return { success: false, partial: false, totalArea, cableDetails, error: 'CONDUIT_NOT_FOUND', message: '指定された配管のデータがありません' };
  }

  const largest = targetConduits[targetConduits.length - 1];

  function findOptimalConduit(conduits: ConduitData[], requiredArea: number, ruleField: 'area32' | 'area48') {
    for (const conduit of conduits) {
      const allowable = Number(conduit[ruleField]);
      if (requiredArea <= allowable) {
        return {
          conduit,
          fillPercent: (requiredArea / Number(conduit.area)) * 100,
          allowable,
          isOversize: false
        };
      }
    }
    return {
      conduit: largest!,
      fillPercent: (requiredArea / Number(largest!.area)) * 100,
      allowable: Number(largest![ruleField]),
      isOversize: requiredArea > Number(largest![ruleField])
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

/**
 * MathJax用の数式データを生成する
 */
export function generateMathData(
  conduitCategory: string,
  inputCables: CableInput[],
  res: ConduitCalcResult | null
): MathStep[] {
  const rowCount = inputCables.length || 1;
  const allCablesKnown = res?.success && !res.partial;
  const totalKnownArea = res?.totalArea || 0;

  const formulaVarStr = rowCount === 1 ? 'A_1' : '\\Sigma A_n';
  const resultStr1 = allCablesKnown ? hlOk(totalKnownArea.toFixed(1)) : '\\text{---}';
  
  const formula1 = buildFormula('A_{total}', formulaVarStr, resultStr1, 'mm^2');

  let formula2 = `\\begin{aligned} \\text{32\\%以下:} \\quad A_{\\text{pipe}} \\times 0.32 &\\ge A_{total} \\\\ \\text{---} \\text{ mm}^2 &\\ge \\text{---} \\text{ mm}^2 \\\\\\\\ \\text{48\\%以下:} \\quad A_{\\text{pipe}} \\times 0.48 &\\ge A_{total} \\\\ \\text{---} \\text{ mm}^2 &\\ge \\text{---} \\text{ mm}^2 \\end{aligned}`;
  if (allCablesKnown && conduitCategory && res?.conduit32 && res?.conduit48) {
    const totalAreaHl = hlVal(totalKnownArea, 'A_{total}', 1);
    const allow32Hl = hlVal(res.allowable32, 'A_{\\text{allow32}}', 1);
    const allow48Hl = hlVal(res.allowable48, 'A_{\\text{allow48}}', 1);
    
    formula2 = `\\begin{aligned} \\text{32\\%以下:} \\quad A_{\\text{pipe}} \\times 0.32 &\\ge A_{total} \\\\ ${allow32Hl} \\text{ mm}^2 &\\ge ${totalAreaHl} \\text{ mm}^2 \\\\ &\\rightarrow \\text{【 } ${hlOk(res.conduit32.size)} \\text{ 】選定} \\\\\\\\ \\text{48\\%以下:} \\quad A_{\\text{pipe}} \\times 0.48 &\\ge A_{total} \\\\ ${allow48Hl} \\text{ mm}^2 &\\ge ${totalAreaHl} \\text{ mm}^2 \\\\ &\\rightarrow \\text{【 } ${hlOk(res.conduit48.size)} \\text{ 】選定} \\end{aligned}`;
  }

  return [
    {
      title: '① ケーブルの断面積算出',
      tex: formula1,
      legend: [
        `\\( A_{total} \\) : ケーブル合計断面積 [mm²]`,
        rowCount === 1 ? `\\( A_1 \\) : ケーブルの断面積 [mm²]` : `\\( A_n \\) : 各ケーブルの合計断面積 [mm²]`
      ]
    },
    {
      title: '② 最小配管サイズの抽出',
      tex: formula2,
      legend: [`\\( A_{\\text{pipe}} \\) : 選定管の断面積 [mm²]`]
    }
  ];
}

