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
    content: '将来の増線や敷設作業性を考慮した余裕率です。内線規程に基づき、強電ラックでは通常1.2倍、弱電ラックでは0.6倍を標準として推奨します。',
    reference: '内線規程・JEAC 8001',
  },
  cableSpacing: {
    id: 'cableSpacing',
    title: 'ケーブル間隔',
    content: '許容電流低減や放熱性を確保するためのケーブル間の離隔距離です。通常10mm〜仕上外径程度を見込みます。',
  },
  sideMargin: {
    id: 'sideMargin',
    title: '親桁クリアランス',
    content: 'ラック両端の親桁（サイドレール）と外側ケーブル間の余白です。親桁の折り返し構造や作業性を考慮し、強電60mm、弱電120mmを標準とします。',
  },
  otherWidth: {
    id: 'otherWidth',
    title: '相乗り必要幅',
    content: '強電と弱電を同一ラックに相乗り敷設する場合、相手側（別区分）に割り当てる必要幅です。合計必要幅に加算されます。',
  },
  rackHeight: {
    id: 'rackHeight',
    title: 'ラック高さ (H)',
    content: '使用するケーブルラックの親桁有効内寸高さです。50mm、70mm、100mmなどが標準的に用いられます。',
  },

  // 配管計算
  conduitCategory: {
    id: 'conduitCategory',
    title: '配管種類',
    content: '敷設する電線管の種類（ねじなし電線管 E、厚鋼 G、薄鋼 C、VE管など）を選択します。管の種類により内径・断面積が異なります。',
  },
  conduitFillRate: {
    id: 'conduitFillRate',
    title: '許容占積率',
    content: '電線管の内断面積に対する全ケーブル断面積の割合です。内線規程では、同一太さの場合48%、異なる太さの場合32%以下が原則です。',
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
