/**
 * 現場ステータス区分
 * - planning: 計画中
 * - in_progress: 施工・試験中
 * - completed: 完工・引渡済
 * - on_hold: 中断・保留
 */
export type SiteStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold'

/**
 * 現場基本情報エンティティ
 */
export type Site = {
  /** 現場固有ID (UUID) */
  id: string
  /** 現場名称（物件名・工事名） */
  name: string
  /** 現場の進捗ステータス */
  status: SiteStatus
  /** 作成日時 (ISO文字列) */
  createdAt: string
  /** 無効化（アーカイブ）日時。nullの場合は有効 */
  disabledAt: string | null
  /** 連携されている回路台帳Excelファイルパス */
  excelPath?: string
  /** 試験成績書エクスポート用テンプレートパス */
  reportTemplatePath?: string
  /** 試験除外対象の回路IDリスト */
  excludedCircuits?: string[]
  /** 現場にアサインされた作業員・試験員名リスト */
  workers?: string[]
}

/**
 * 現場固有の送電試験設定
 */
export type SiteSettings = {
  /** 対象現場ID */
  siteId: string
  /** フェーズ2絶縁抵抗合格判定基準閾値 (MΩ) */
  phase2ThresholdMegOhm: number
  /** フェーズ3（送電試験）を有効化するかどうか */
  enablePhase3: boolean
}
