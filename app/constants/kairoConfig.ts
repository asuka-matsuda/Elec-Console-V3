/**
 * 回路記号（Kairo Symbol）設定定義
 * 送電試験・回路一覧で用いられる各種回路記号の形状マッピングと定義を管理します。
 * 今後新しい記号（三角・六角形・菱形など）が追加された場合も、
 * この設定ファイルに定義を追加するだけでコンポーネントを変更せずに拡張可能です。
 */

export type KairoShapeType = 'circle' | 'ellipse' | 'rect' | 'polygon'

export interface KairoSymbolDefinition {
  type: KairoShapeType
  isDouble?: boolean
  /** 多角形（polygon）の場合の頂点座標（40x40 viewBox 基準） */
  points?: string
  innerPoints?: string
}

/**
 * 記号名・表記揺れ（エイリアス）から形状定義へのマッピングテーブル
 */
export const KAIRO_SYMBOL_MAP: Record<string, KairoSymbolDefinition> = {
  // --- 丸 / 二重丸 ---
  '丸': { type: 'circle' },
  '○': { type: 'circle' },
  '〇': { type: 'circle' },
  '二重丸': { type: 'circle', isDouble: true },
  '◎': { type: 'circle', isDouble: true },

  // --- 楕円 / 二重楕円 ---
  '楕円': { type: 'ellipse' },
  '二重楕円': { type: 'ellipse', isDouble: true },

  // --- 四角 / 二重四角 ---
  '四角': { type: 'rect' },
  '□': { type: 'rect' },
  '二重四角': { type: 'rect', isDouble: true },

  // --- 拡張対応例：三角・菱形・六角形などが必要になった場合も即座に対応可能 ---
  '三角': {
    type: 'polygon',
    points: '20,3 37,36 3,36',
  },
  '二重三角': {
    type: 'polygon',
    isDouble: true,
    points: '20,3 37,36 3,36',
    innerPoints: '20,9 32,33 8,33',
  },
  '菱形': {
    type: 'polygon',
    points: '20,2 38,20 20,38 2,20',
  },
  '二重菱形': {
    type: 'polygon',
    isDouble: true,
    points: '20,2 38,20 20,38 2,20',
    innerPoints: '20,6 34,20 20,34 6,20',
  },
  '六角形': {
    type: 'polygon',
    points: '20,2 36,11 36,29 20,38 4,29 4,11',
  },
}

/**
 * 回路記号文字列から対応する形状定義を解決する純粋関数
 */
export function resolveKairoSymbol(kigou?: string | null): KairoSymbolDefinition | null {
  if (!kigou) return null

  return KAIRO_SYMBOL_MAP[kigou.trim()] ?? null
}
