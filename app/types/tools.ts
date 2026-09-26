/**
 * 数学・物理計算の展開ステップ（LaTeX/KaTeX数式表示用）
 */
export type MathStep = {
  /** ステップタイトル（例: 「1. 負荷電流の算出」） */
  title?: string
  /** KaTeX形式の数式文字列 */
  tex: string
  /** 記号の凡例説明リスト */
  legend?: string[]
}

/**
 * 管内・ラック積載計算用の入線ケーブル行データ
 */
export interface CableInputItem {
  /** 一時行ID */
  id: string
  /** ケーブル分類（VVF, IV, CV等） */
  category: string
  /** ケーブルサイズインデックス */
  cableIdx: string
  /** 条数・本数 */
  count: number | null
}

/**
 * 各種計算ツール（電圧降下・電線管・ラック・重量）の実行・保存履歴エントリ定義
 */
export interface HistoryEntry<
  TInputs = Record<string, unknown>,
  TResults = Record<string, unknown>,
> {
  id: string
  toolId?: string
  toolName: string
  mode?: string
  timestamp: string
  status: 'success' | 'error' | 'warning'
  mainResultText: string
  inputs: { label: string, value: string }[]
  results: { label: string, value: string, isMain?: boolean, color?: string }[]
  rawInputs?: TInputs
  rawResult?: TResults
}
