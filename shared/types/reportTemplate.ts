/**
 * 帳票テンプレート・フォーマット定義型
 *
 * @description システムマスターで管理される各帳票のひな形Excel情報、現場割り当て、および使用可能キー定義
 */

export type ReportLogicType = 'tag' | 'socket-tepra' | 'exam' | 'remote'

export interface ReportTemplateKeyDefinition {
  /** キー記法（例: "%盤名称%"） */
  key: string
  /** 項目名（例: "盤名称"） */
  label: string
  /** 説明 */
  description: string
  /** サンプル値 */
  sample: string
}

export interface ReportTemplateRegisteredFile {
  filename: string
  size: number
  updatedAt: string
}

export interface ReportLogicMeta {
  id: ReportLogicType
  name: string
  description: string
  icon: string
  category: string
  flowType: 'tags' | 'list' | 'sheet' | 'matrix'
  availableKeys: ReportTemplateKeyDefinition[]
}

export type ReportTemplateMeta = ReportLogicMeta & {
  registeredFile?: ReportTemplateRegisteredFile | null
}

/**
 * マスター管理で登録された帳票テンプレートエンティティ
 */
export interface MasterReportTemplateItem {
  /** テンプレート一意ID */
  id: string
  /** 帳票表示名 */
  name: string
  /** 流し込みロジック種別 */
  logicType: ReportLogicType
  /** 適用するTypeScriptロジックファイル（例: 'kfc-3350', 'standard'） */
  logicFile?: string
  /** 補足説明・備考 */
  description?: string
  /** 登録ひな形Excelファイル情報 */
  file: ReportTemplateRegisteredFile
  /** 全現場共通で使用可能にするか */
  isAllSites: boolean
  /** 割り当てられた現場IDリスト（isAllSites=falseのとき使用） */
  assignedSiteIds: string[]
  /** 作成日時 */
  createdAt: string
  /** 更新日時 */
  updatedAt: string
}

/**
 * 帳票テンプレート登録・編集フォーム
 */
export interface MasterReportTemplateForm {
  name: string
  logicType: ReportLogicType
  logicFile?: string
  description?: string
  isAllSites: boolean
  assignedSiteIds: string[]
}
