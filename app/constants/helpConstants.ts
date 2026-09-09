/**
 * ヘルプ項目・解説コンテンツの共通定義
 */
export interface HelpContent {
  id: string
  title?: string
  content: string
  reference?: string
}

export const HELP_ITEMS: Record<string, HelpContent> = {
  // ケーブルラック計算
  marginRate: {
    id: 'marginRate',
    title: '余裕係数',
    content: '将来の増線や敷設作業性を考慮した余裕率。標準値は強電ラック1.2倍、弱電ラック0.6倍。',
  },
  cableSpacing: {
    id: 'cableSpacing',
    title: 'ケーブル間隔',
    content: '許容電流低減や放熱性確保のためのケーブル間離隔距離。通常10mm〜仕上外径程度。',
  },
  sideMargin: {
    id: 'sideMargin',
    title: '親桁クリアランス',
    content: 'ラック両端の親桁と外側ケーブル間の余白。親桁の折り返し構造や作業性を考慮し、強電60mm(30mm×2)、弱電120mm(60mm×2)が標準。',
  },
  otherWidth: {
    id: 'otherWidth',
    title: '相乗り必要幅',
    content: '強電と弱電を同一ラックに相乗り敷設する場合の相手側（別区分）必要幅。合計必要幅に加算。',
  },
  rackHeight: {
    id: 'rackHeight',
    title: 'ラック高さ (H)',
    content: 'ケーブルラックの親桁有効内寸高さ。標準サイズは70mm、100mmなど。',
  },

  // 配管計算
  conduitCategory: {
    id: 'conduitCategory',
    title: '配管種類',
    content: '敷設する電線管の種類（ねじなし電線管 E、厚鋼 G、薄鋼 C、VE管など）。管種ごとの内径・断面積を適用。',
  },
  conduitFillRate: {
    id: 'conduitFillRate',
    title: '許容占積率',
    content: '電線管の内断面積に対する全ケーブル断面積の割合。同一太さは48%以下、異なる太さは32%以下が原則。',
    reference: '内線規程 3105-3',
  },
} as const

export type HelpId = keyof typeof HELP_ITEMS | (string & {})

/**
 * ヘルプIDからヘルプコンテンツを取得する関数
 */
export function getHelpContent(id: HelpId): HelpContent | undefined {
  return HELP_ITEMS[id]
}
