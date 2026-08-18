export interface SystemData {
  id: string;
  label: string;
  tags: string[];
  voltage: number;
  coefficient: number;
  reqCores: string;
  kwDivisor: number;
  simpleK: number;
}

export interface CableData {
  name?: string;
  category: string;
  cores?: string;
  size: string | number;
  unit: string;
  ampacity?: string | number;
  baseTemp?: string | number;
  maxTemp?: string | number;
  [key: string]: any; // Allow other properties
}

export interface VoltageCalcInputs {
  mode: "size" | "drop";
  sys: SystemData;
  I: number;
  L: number;
  cableType: string;
  selectedCores: string | null;
  derating: number;
  rawTempVal: string | null;
  ambientTemp: number | null;
  parallel: number;
  targetDrop: number | null;
  selectedSize: number | null;
  loadVal: number;
  loadUnit: string;
  pf: number;
  isReady: boolean;
  missingFields: string[];
}

export interface VoltageCalcResult {
  optimal: CableData;
  minAmpacityCable: CableData | null;
  finalEffAmp: number;
  finalDropV: number;
  parallelCount: number;
  convertedA: number;
  tempDerating: number;
}

export interface MathStep {
  title?: string;
  tex: string;
  legend: string[];
}
