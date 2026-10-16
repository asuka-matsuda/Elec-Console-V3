/**
 * ヘルプ項目・解説コンテンツの共通定義
 */
export interface HelpContent {
  id: string
  content: string
  reference?: string
}

export const HELP_ITEMS: Record<string, HelpContent> = {
  // ケーブルラック計算
  marginRate: {
    id: 'marginRate',
    content: '将来の増線や敷設作業性を考慮した余裕率。標準値は強電ラック1.2倍、弱電ラック0.6倍。',
  },
  cableSpacing: {
    id: 'cableSpacing',
    content: '許容電流低減や放熱性確保のためのケーブル間離隔距離。通常10mm〜仕上外径程度。',
  },
  sideMargin: {
    id: 'sideMargin',
    content: 'ラック両端の親桁と外側ケーブル間の余白。親桁の折り返し構造や作業性を考慮し、強電60mm(30mm×2)、弱電120mm(60mm×2)が標準。',
  },
  otherWidth: {
    id: 'otherWidth',
    content: '強電と弱電を同一ラックに相乗り敷設する場合の相手側（別区分）必要幅。合計必要幅に加算。',
  },
  rackHeight: {
    id: 'rackHeight',
    content: 'ケーブルラックの親桁有効内寸高さ。標準サイズは70mm、100mmなど。',
  },
} as const

export type HelpId = keyof typeof HELP_ITEMS | (string & {})
