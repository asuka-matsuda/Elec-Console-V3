/**
 * 日付・日時フォーマット関連の共通ユーティリティ
 */

export const formatDate = (date: unknown, fallback = '-'): string => {
  if (!date) return fallback
  const d = date instanceof Date ? date : new Date(String(date))

  if (isNaN(d.getTime())) return fallback

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${y}/${m}/${day}`
}

export const formatDateTime = (date: unknown, fallback = '-'): string => {
  if (!date) return fallback
  const d = date instanceof Date ? date : new Date(String(date))

  if (isNaN(d.getTime())) return fallback

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')

  return `${y}/${m}/${day} ${h}:${min}`
}

export const formatTime = (date: unknown, fallback = '-'): string => {
  if (!date) return fallback
  const d = date instanceof Date ? date : new Date(String(date))

  if (isNaN(d.getTime())) return fallback

  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')

  return `${h}:${min}`
}
