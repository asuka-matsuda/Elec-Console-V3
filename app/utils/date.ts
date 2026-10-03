/**
 * 日付・日時フォーマット関連の共通ユーティリティ
 */

export {
  formatDate,
  formatDateTime,
  formatShortDateTime,
  formatTime,
  parseDateSafe,
} from '#shared/utils/date'

/**
 * Date オブジェクトまたは日付文字列を YYYY-MM-DD 形式の文字列（<input type="date"> 用）に変換する
 */
export const formatToDateInputString = (...args: [date?: unknown, fallback?: string]): string => {
  const [date, fallback = ''] = args

  if (args.length === 0) {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    return `${y}-${m}-${day}`
  }

  const d = parseDateSafe(date)

  if (!d) return fallback

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${y}-${m}-${day}`
}

/**
 * 今日の日付文字列を YYYY-MM-DD 形式（<input type="date"> 用）で取得する
 */
export const getTodayDateInput = (): string => formatToDateInputString(new Date())

/**
 * Date オブジェクトを YYYY-MM-DDTHH:mm 形式の文字列に変換する
 */
const formatToDateTimeInputString = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')

  return `${y}-${m}-${day}T${h}:${min}`
}

/**
 * 開始日時・終日設定に基づき、終了日時を自動補完・検証して返す
 */
export const calculateAutoEndDate = (
  start: string,
  currentEnd: string | undefined | null,
  allDay: boolean,
): string => {
  if (!start) return currentEnd || ''

  const startDate = new Date(start)

  if (isNaN(startDate.getTime())) return currentEnd || ''

  const endDate = currentEnd ? new Date(currentEnd) : null

  // 終了日時がすでに妥当（start <= end）であればそのまま返す
  if (endDate && !isNaN(endDate.getTime()) && endDate >= startDate) {
    return currentEnd!
  }

  if (allDay) {
    return start.split('T')[0] || ''
  }

  const newEnd = new Date(startDate.getTime() + 60 * 60 * 1000)

  return formatToDateTimeInputString(newEnd)
}

/**
 * 終日フラグの切り替えに応じて、開始・終了日時の形式を調整する
 */
export const adjustDateRangeForAllDay = (
  start: string,
  end: string,
  isAllDay: boolean,
): { start: string, end: string } => {
  if (!start) return { start, end }

  let adjustedStart = start
  let adjustedEnd = end

  if (isAllDay) {
    adjustedStart = start.split('T')[0] || ''
    if (end) adjustedEnd = end.split('T')[0] || ''
  }
  else {
    if (!adjustedStart.includes('T')) adjustedStart += 'T09:00'
    if (adjustedEnd && !adjustedEnd.includes('T')) adjustedEnd += 'T10:00'
  }

  adjustedEnd = calculateAutoEndDate(adjustedStart, adjustedEnd, isAllDay)

  return { start: adjustedStart, end: adjustedEnd }
}
