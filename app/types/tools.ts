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
 * 電線管サイズ計算入力パラメータ
 */
export interface ConduitCalcInputs {
  /** 電線管種別（薄鋼、厚鋼、VE管等） */
  conduitCategory: string
  /** カスタム許容占有率 (%, null時は内線規程基準を適用) */
  customFillRate: number | null
  /** 入線対象ケーブルリスト */
  inputCables: CableInputItem[]
}

export type ConduitInputData = ConduitCalcInputs
