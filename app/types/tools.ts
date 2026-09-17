export type MathStep = {
  title?: string
  tex: string
  legend?: string[]
}

export interface CableInputItem {
  id: string
  category: string
  cableIdx: string
  count: number | null
}

export interface ConduitCalcInputs {
  conduitCategory: string
  customFillRate: number | null
  inputCables: CableInputItem[]
}

export type ConduitInputData = ConduitCalcInputs
