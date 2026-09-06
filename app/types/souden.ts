export interface CircuitItem {
  id: string
  siteId: string
  excelRow?: number | null
  joutai?: string | null
  keiTo: string
  banShubetsu: string
  banMeisho: string
  haidenHoushiki?: string | null
  souShubetsu?: string | null
  kairoKigou?: string | null
  kairoBangou?: string | null
  kairoMeisho?: string | null
  shadankiShubetsu?: string | null
  shadankiYouryou?: string | null
  cableList?: string | null
  haisenJousuu?: string | null
  setsuchiUmu?: string | null
  setsuchiList?: string | null

  p1Kakunin: boolean
  p1Mashishime: boolean
  p1Worker?: string | null
  p1ConfirmedAt?: string | null
  p1Remarks?: string | null
  p1ModifiedFields?: string | null

  zetsuenR?: number | null
  zetsuenS?: number | null
  zetsuenT?: number | null
  p2RStatus?: string | null
  p2SStatus?: string | null
  p2TStatus?: string | null
  p2Worker?: string | null
  p2ConfirmedAt?: string | null
  p2Remarks?: string | null
  p2IsComplete: boolean

  denatsuRs?: number | null
  denatsuSt?: number | null
  denatsuRt?: number | null
  kensou?: string | null
  p3Worker?: string | null
  p3ConfirmedAt?: string | null
  p3Remarks?: string | null

  isExcluded?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface PanelOption {
  banShubetsu: string
  banMeisho: string
}

export interface CircuitsResponse {
  circuits: CircuitItem[]
  panelOptions: PanelOption[]
  panelsWithIncompleteKansen: string[]
  phase2ThresholdMegOhm?: number
  total: number
}

export interface OperationLogItem {
  id: string
  siteId: string
  timestamp: string
  worker: string
  action: string
  targetBan?: string | null
  targetKairo?: string | null
  details?: string | null
}

export interface OperationLogsResponse {
  logs: OperationLogItem[]
  availableWorkers: string[]
  availableActions: string[]
  availableTargetBans: string[]
  total: number
}
