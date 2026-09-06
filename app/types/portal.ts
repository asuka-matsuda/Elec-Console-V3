export interface EventFormData {
  title: string
  type: string
  start: string
  end: string
  allDay: boolean
}

export interface SoudenStats {
  totalPct: number
  totalCircuits: number
  totalActive: number
  totalExcluded: number
  p1Total: number
  p2Total: number
  p3Total: number

  trunkTotal: number
  trunkExcluded: number
  trunkP1: number
  trunkP1Pct: number
  trunkP2: number
  trunkP2Pct: number
  trunkP3: number
  trunkP3Pct: number
  trunkOverallPct: number

  secTotal: number
  secExcluded: number
  secP1: number
  secP1Pct: number
  secP2: number
  secP2Pct: number
  secP3: number
  secP3Pct: number
  secOverallPct: number
}
