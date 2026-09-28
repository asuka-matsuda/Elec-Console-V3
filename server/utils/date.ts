/**
 * サーバー側 日時フォーマット共通ユーティリティ
 *
 * サーバーログやAPIレスポンスの日時フォーマットを一元化します。
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

export const formatDate = (date: unknown, fallback = '-'): string => {
  const d = parseDateSafe(date)

  if (!d) return fallback

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${y}/${m}/${day}`
}

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
 * 送信同期ログ用の時刻文字列 (HH:mm) を安全に生成する
 */
export const formatSyncTimeString = (date: unknown = new Date()): string => {
  const d = parseDateSafe(date)

  if (!d) return '--:--'

  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')

  return `${h}:${min}`
}
