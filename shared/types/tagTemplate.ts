/**
 * 線名札・タグ帳票 テンプレート定義型
 *
 * @description テンプレートExcelファイルごとの確定的なスロット配置（行・列・ピッチ・項目マッピング）を
 * TypeScriptで型安全に定義するためのインターフェース。
 */

export interface TagSlotCellDef {
  /** 埋め込みキー（例: '回路番号', 'ケーブル', '配電方式', '系統', '回路名称'） */
  key: string
  /** 行番号（1-indexed, 1ページ目基準） */
  row: number
  /** 列番号（1-indexed） */
  col: number
}

export interface TagSlotDef {
  /** スロット通し番号（0-indexed） */
  slotIndex: number
  /** スロットを構成するセル一覧 */
  cells: TagSlotCellDef[]
}

export interface TagTemplateDefinition {
  /** テンプレート一意識別子（例: 'kfc-3350'） */
  id: string
  /** 表示名 */
  name: string
  /** 補足説明 */
  description?: string
  /** 1ページの行数（改ページ複製ピッチ） */
  pageHeight: number
  /** 1ページあたりのスロット数 */
  slotsPerPage: number
  /**
   * テンプレート名またはファイル名からこの定義を適用するか判定する関数
   */
  match: (nameOrFilename: string) => boolean
  /**
   * 指定された流し込み順（Z順: 行優先, N順: 列優先）に応じたスロット一覧を返す
   */
  getSlots: (flowDirection: 'z' | 'n') => TagSlotDef[]
}
