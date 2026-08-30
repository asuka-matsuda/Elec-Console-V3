// toolOptions.ts
export const modeOptions = [
  { label: "電圧降下", value: "drop", color: "var(--color-category-tool)" },
  { label: "導体断面積", value: "size", color: "var(--color-category-tool)" },
];

export const phaseOptions = [
  { label: "単相2線式 100V", value: "1P2W100" },
  { label: "単相2線式 200V", value: "1P2W200" },
  { label: "単相3線式 100/200V", value: "1P3W200" },
  { label: "三相3線式 200V", value: "3P3W200" },
  { label: "三相3線式 400V", value: "3P3W400" },
];

export const loadUnitOptions = [
  { label: "A", value: "A" },
  { label: "kW", value: "kW" },
  { label: "kVA", value: "kVA" },
  { label: "VA", value: "VA" },
];

export const powerFactorOptions = [
  { label: "1.0 (電熱器・白熱灯等)", value: "1.0" },
  { label: "0.95", value: "0.95" },
  { label: "0.9", value: "0.9" },
  { label: "0.85", value: "0.85" },
  { label: "0.8 (モーター・一般動力等)", value: "0.8" },
  { label: "0.75", value: "0.75" },
  { label: "0.7", value: "0.7" },
  { label: "0.65", value: "0.65" },
  { label: "0.6", value: "0.6" },
];

export const cableTypeOptions = [
  { label: "CVT / CET", value: "CVT" },
  { label: "CV / CE", value: "CV" },
  { label: "IV / EM-IE", value: "IV" },
  { label: "VVF (平型)", value: "VVF" },
];

export const parallelOptions = [
  { label: "1条", value: "1" },
  { label: "2条", value: "2" },
  { label: "3条", value: "3" },
  { label: "4条", value: "4" },
  { label: "5条", value: "5" },
  { label: "6条", value: "6" },
];

export const deratingOptions = [
  { label: "気中・ラック (係数 1.0)", value: "1.0" },
  { label: "電線管内 3条以下 (0.70)", value: "0.7" },
  { label: "電線管内 4条 (0.63)", value: "0.63" },
  { label: "電線管内 5〜6条 (0.56)", value: "0.56" },
];

export const ambientTempOptions = [
  { label: "使用しない（補正なし）", value: "none" },
  { label: "30℃", value: "30" },
  { label: "40℃", value: "40" },
  { label: "50℃", value: "50" },
  { label: "60℃", value: "60" },
];

export const targetDropOptions = [
  { label: "2% 以下", value: "2" },
  { label: "3% 以下", value: "3" },
  { label: "4% 以下", value: "4" },
  { label: "5% 以下", value: "5" },
  { label: "6% 以下", value: "6" },
  { label: "7% 以下", value: "7" },
];
