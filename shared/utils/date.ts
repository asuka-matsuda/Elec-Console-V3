/**
 * 日付・日時フォーマット関連の共有ユーティリティ（SSoT）
 * クライアントとサーバーの双方が参照する単一真実源です。
 */

/**
 * 様々な入力（Date、ISO文字列、YYYY-MM-DD、YYYY/MM/DD、YYYY.MM.DD）を安全に Date に変換する
 */
export const parseDateSafe = (date: unknown): Date | null => {
  if (!date) return null
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date
  }

  const str = String(date).trim()

  if (!str) return null

  // YYYY.MM.DD 形式を正規化
  const normalized = str.includes('.') && /^\d{4}\.\d{1,2}\.\d{1,2}/.test(str)
    ? str.replace(/\./g, '-')
    : str

  const d = new Date(normalized)

  return isNaN(d.getTime()) ? null : d
}

/**
 * 日付フォーマット (YYYY/MM/DD)
 */
export const formatDate = (date: unknown, fallback = '-'): string => {
  const d = parseDateSafe(date)

  if (!d) return fallback

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${y}/${m}/${day}`
}

/**
 * 日時フォーマット (YYYY/MM/DD HH:mm または YYYY/MM/DD HH:mm:ss)
 */
export const formatDateTime = (
  date: unknown,
  fallback = '-',
  options: { withSeconds?: boolean } = {},
): string => {
  const d = parseDateSafe(date)

  if (!d) return fallback

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')

  if (options.withSeconds) {
    const s = String(d.getSeconds()).padStart(2, '0')

    return `${y}/${m}/${day} ${h}:${min}:${s}`
  }

  return `${y}/${m}/${day} ${h}:${min}`
}

/**
 * 短縮日時フォーマット (MM/DD HH:mm)
 */
export const formatShortDateTime = (date: unknown, fallback = '-'): string => {
  const d = parseDateSafe(date)

  if (!d) return fallback

  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')

  return `${m}/${day} ${h}:${min}`
}

/**
 * 時刻フォーマット (HH:mm)
 */
export const formatTime = (date: unknown, fallback = '-'): string => {
  const d = parseDateSafe(date)

  if (!d) return fallback

  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')

  return `${h}:${min}`
}
