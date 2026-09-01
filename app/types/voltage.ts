import type { CableData } from '~/types/database'

export interface SystemData {
  id: string
  label: string
  tags: string[]
  voltage: number
  coefficient: number
  reqCores: string
  kwDivisor: number
  simpleK: number
}

export interface VoltageCalcInputs {
  mode: 'size' | 'drop'
  sys: SystemData
  I: number | null
  L: number | null
  cableType: string
  selectedCores: string | null
  derating: number | null
  rawTempVal: string | null
  ambientTemp: number | null
  parallel: number | null
  targetDrop: number | null
  selectedSize: number | null
  loadVal: number | null
  loadUnit: string
  pf: number | null
  isReady: boolean
  missingFields: string[]
}

export interface VoltageCalcResult {
  optimal: CableData
  minAmpacityCable: CableData | null
  finalEffAmp: number
  finalDropV: number
  parallelCount: number
  convertedA: number
  tempDerating: number
}

export interface MathStep {
  title?: string
  tex: string
  legend: string[]
}
