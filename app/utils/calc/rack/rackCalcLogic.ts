export interface RackCableInput {
  d: number;
  n: number;
}

export interface RackCalcInputs {
  isStrong: boolean;
  isWeak: boolean;
  lStrong: number;
  lWeak: number;
  rackHeight: number;
  maxDepth: number;
  strongCables: RackCableInput[];
  weakCables: RackCableInput[];
  separatorWidth: number;
}

export interface RackCalcResult {
  error: boolean;
  wStrong: number;
  wWeak: number;
  wSep: number;
  totalWidth: number;
  selectedSize: number | null;
  isOverflow: boolean;
  maxCableStackHeight: number;
  maxStackDetailStr: string;
  maxDepth: number;
  rackHeight: number;
  sumStrong: number;
  sumWeak: number;
}

/**
 * ケーブル外径と条数から、ケーブルの直径リストを生成する
 */
export function getCableDiameters(cables: RackCableInput[]): number[] {
  const diams: number[] = [];
  for (const cable of cables) {
    if (cable.d > 0 && cable.n > 0) {
      for (let i = 0; i < cable.n; i++) {
        diams.push(cable.d);
      }
    }
  }
  return diams;
}

/**
 * 指定された段数で積み重ねた場合のケーブル最大高さを計算する
 */
export function getStackHeightFromDiams(diams: number[], layers: number): { height: number; detailStr: string } {
  const sortedDiams = [...diams].sort((a, b) => b - a);
  let h = 0;
  const terms: string[] = [];
  for (let i = 0; i < Math.min(layers, sortedDiams.length); i++) {
    const val = sortedDiams[i]!;
    h += val;
    terms.push(val.toFixed(1));
  }
  return {
    height: h,
    detailStr: terms.length > 0 ? terms.join(' + ') : '0'
  };
}

/**
 * ケーブルリストの総必要幅（1段積み換算）を算出するための基準和を計算する
 */
export function calculateSectionSumFromCables(cables: RackCableInput[]): number {
  let sum = 0;
  for (const cable of cables) {
    if (cable.d > 0 && cable.n > 0) {
      sum += (cable.d + 10) * cable.n;
    }
  }
  return sum;
}

/**
 * ラック幅およびはみ出し判定などのメイン計算処理を行う
 */
export function calculateRackSize(inputs: RackCalcInputs, standardRackSizes: number[]): RackCalcResult {
  const {
    isStrong,
    isWeak,
    lStrong,
    lWeak,
    rackHeight,
    maxDepth,
    strongCables,
    weakCables,
    separatorWidth
  } = inputs;

  let wStrong = 0;
  let wWeak = 0;
  let wSep = 0;

  let stackHStrong = { height: 0, detailStr: '0' };
  let stackHWeak = { height: 0, detailStr: '0' };

  let sumStrong = 0;
  let sumWeak = 0;

  if (isStrong) {
    sumStrong = calculateSectionSumFromCables(strongCables);
    if (sumStrong > 0) wStrong = (1.2 * (sumStrong + 60)) / Math.max(1, lStrong);
    stackHStrong = getStackHeightFromDiams(getCableDiameters(strongCables), lStrong);
  }
  if (isWeak) {
    sumWeak = calculateSectionSumFromCables(weakCables);
    if (sumWeak > 0) wWeak = (0.6 * (sumWeak + 120)) / Math.max(1, lWeak);
    stackHWeak = getStackHeightFromDiams(getCableDiameters(weakCables), lWeak);
  }

  let maxCableStackHeight = 0;
  let maxStackDetailStr = '0';
  if (stackHStrong.height >= stackHWeak.height) {
    maxCableStackHeight = stackHStrong.height;
    maxStackDetailStr = stackHStrong.detailStr;
  } else {
    maxCableStackHeight = stackHWeak.height;
    maxStackDetailStr = stackHWeak.detailStr;
  }

  const isOverflow = maxCableStackHeight > maxDepth;
  if (isStrong && isWeak && separatorWidth !== undefined && separatorWidth !== null) {
    wSep = separatorWidth;
  }

  const totalWidth = wStrong + wWeak + wSep;
  const selectedSize = standardRackSizes.find((s) => s >= totalWidth) || null;

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
    maxDepth,
    rackHeight,
    sumStrong,
    sumWeak
  };
}
