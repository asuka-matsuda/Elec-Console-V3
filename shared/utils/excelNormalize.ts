/**
 * Excel操作共通ユーティリティ（クライアント・サーバー両用 SSoT）
 *
 * セル値の安全な文字列抽出およびヘッダー・見出し文字列の正規化を提供します。
 */

/**
 * Excel見出し・ヘッダー文字列の正規化（全角半角統一・空白改行アンダースコア除去・小文字化）
 */
export function normalizeHeaderName(name: unknown): string {
  if (name === null || name === undefined) return ''

  return String(name)
    .normalize('NFKC')
    .replace(/[\s\r\n\t_]/g, '')
    .toLowerCase()
}

/**
 * 互換用エイリアス（既存呼び出し元との互換性を維持）
 */
export const normalizeText = normalizeHeaderName

/**
 * セル値のセーフな文字列取得（Formula / RichText / Date / プリミティブ対応）
 */
export function cellValueToString(value: unknown): string {
  if (value === null || value === undefined) return ''

  if (typeof value === 'object') {
    if (value instanceof Date) {
      const y = value.getFullYear()
      const m = String(value.getMonth() + 1).padStart(2, '0')
      const d = String(value.getDate()).padStart(2, '0')

      return `${y}/${m}/${d}`
    }

    const obj = value as Record<string, unknown>

    if ('richText' in obj && Array.isArray(obj.richText)) {
      return obj.richText.map((t: { text?: string }) => t.text || '').join('')
    }

    if ('text' in obj && typeof obj.text === 'string') {
      return cellValueToString(obj.text)
    }

    if ('result' in obj && obj.result !== undefined && obj.result !== null) {
      return cellValueToString(obj.result)
    }
  }

  return String(value)
}
