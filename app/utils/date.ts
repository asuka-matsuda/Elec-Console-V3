/**
 * 日付・日時フォーマット関連の共通ユーティリティ
 */

export {
  formatDate,
  formatDateTime,
  formatShortDateTime,
  formatTime,
  getDateComponents,
  parseDateSafe,
} from '#shared/utils/date'

/**
 * Date オブジェクトまたは日付文字列を YYYY-MM-DD 形式の文字列（<input type="date"> 用）に変換する
 */
export const formatToDateInputString = (...args: [date?: unknown, fallback?: string]): string => {
  const [date, fallback = ''] = args
  const d = args.length === 0 ? new Date() : parseDateSafe(date)

  if (!d) return fallback

  const { year, month, day } = getDateComponents(d)

  return `${year}-${month}-${day}`
}

/**
 * 今日の日付文字列を YYYY-MM-DD 形式（<input type="date"> 用）で取得する
 */
export const getTodayDateInput = (): string => formatToDateInputString()

/**
 * Date オブジェクトを YYYY-MM-DDTHH:mm 形式の文字列に変換する
 */
const formatToDateTimeInputString = (date: Date): string => {
  const { year, month, day, hours, minutes } = getDateComponents(date)

  return `${year}-${month}-${day}T${hours}:${minutes}`
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

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const

/**
 * YYYY-MM-DD 文字列をローカルタイムゾーンの Date オブジェクト（00:00:00）へ変換する
 */
const parseLocalIsoDate = (dateStr: string): Date | null => {
  const clean = dateStr.trim().slice(0, 10)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clean)

  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const d = new Date(year, month - 1, day)

  if (
    isNaN(d.getTime())
    || d.getFullYear() !== year
    || d.getMonth() !== month - 1
    || d.getDate() !== day
  ) {
    return null
  }

  return d
}

/**
 * 基準日（todayStr）から目標日（targetStr）までの残り稼働日数（現場休日を除く）を算出する
 *
 * - 過去日（target < today）の場合: -1
 * - 当日（target === today）の場合: 0
 * - 未来日（target > today）の場合: (today, target] のうち定休曜日・特別休工日を除いた稼働日数（0以上）
 */
export const calculateRemainingWorkingDays = (
  todayStr: string,
  targetStr: string,
  holidayDays: number[] = [0, 6],
  customHolidays: string[] = [],
): number => {
  const todayDateStr = todayStr.trim().slice(0, 10)
  const targetDateStr = targetStr.trim().slice(0, 10)

  if (!todayDateStr || !targetDateStr) return 0
  if (targetDateStr < todayDateStr) return -1
  if (targetDateStr === todayDateStr) return 0

  const todayDate = parseLocalIsoDate(todayDateStr)
  const targetDate = parseLocalIsoDate(targetDateStr)

  if (!todayDate || !targetDate) return 0

  const holidayDaySet = new Set(holidayDays)
  const customHolidaySet = new Set(customHolidays.map(h => h.trim().slice(0, 10)))

  let workingDays = 0
  const cursor = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() + 1)
  let safetyCounter = 0

  while (cursor <= targetDate && safetyCounter < 3660) {
    const y = cursor.getFullYear()
    const m = String(cursor.getMonth() + 1).padStart(2, '0')
    const d = String(cursor.getDate()).padStart(2, '0')
    const iso = `${y}-${m}-${d}`
    const dayOfWeek = cursor.getDay()

    if (!holidayDaySet.has(dayOfWeek) && !customHolidaySet.has(iso)) {
      workingDays++
    }

    cursor.setDate(cursor.getDate() + 1)
    safetyCounter++
  }

  return workingDays
}

/**
 * 開始日〜終了日（YYYY-MM-DD）の期間を1日ごとの YYYY-MM-DD 配列に展開する（最大366日）
 */
export const expandDateRange = (startStr: string, endStr?: string | null): string[] => {
  const startClean = startStr.trim().slice(0, 10)
  const startDate = parseLocalIsoDate(startClean)

  if (!startDate) return []

  const endClean = (endStr || '').trim().slice(0, 10)
  const endDate = endClean ? parseLocalIsoDate(endClean) : null

  if (!endDate || endDate <= startDate) {
    return [startClean]
  }

  const result: string[] = []
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
  let count = 0

  while (cursor <= endDate && count < 366) {
    const y = cursor.getFullYear()
    const m = String(cursor.getMonth() + 1).padStart(2, '0')
    const d = String(cursor.getDate()).padStart(2, '0')

    result.push(`${y}-${m}-${d}`)
    cursor.setDate(cursor.getDate() + 1)
    count++
  }

  return result
}

/**
 * YYYY-MM-DD を「YYYY/MM/DD (曜)」形式にフォーマットする
 */
export const formatDateWithWeekday = (dateStr: string): string => {
  const d = parseLocalIsoDate(dateStr)

  if (!d) return dateStr

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const w = WEEKDAY_LABELS[d.getDay()] || ''

  return `${y}/${m}/${day} (${w})`
}

const nationalHolidayCache = new Map<number, Set<string>>()

const getNthMonday = (year: number, month: number, nth: number): number => {
  const firstDay = new Date(year, month - 1, 1).getDay()
  const firstMonday = firstDay === 1 ? 1 : (firstDay === 0 ? 2 : 9 - firstDay)

  return firstMonday + (nth - 1) * 7
}

const buildJapaneseHolidaysForYear = (year: number): Set<string> => {
  const cached = nationalHolidayCache.get(year)

  if (cached) return cached

  const pad = (n: number) => String(n).padStart(2, '0')
  const toIso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`

  const holidays = new Set<string>()
  const add = (m: number, d: number) => holidays.add(toIso(year, m, d))

  // 固定祝日・ハッピーマンデー
  add(1, 1) // 元日
  add(1, getNthMonday(year, 1, 2)) // 成人の日
  add(2, 11) // 建国記念の日
  if (year >= 2020) add(2, 23) // 天皇誕生日

  // 春分の日（1980〜2099年対応簡易天文計算式）
  const vernalEquinox = Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4))

  add(3, vernalEquinox)

  add(4, 29) // 昭和の日
  add(5, 3) // 憲法記念日
  add(5, 4) // みどりの日
  add(5, 5) // こどもの日
  add(7, getNthMonday(year, 7, 3)) // 海の日
  if (year >= 2016) add(8, 11) // 山の日

  const keiroDay = getNthMonday(year, 9, 3)
  const autumnalEquinox = Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4))

  add(9, keiroDay) // 敬老の日
  add(9, autumnalEquinox) // 秋分の日

  // 国民の休日（敬老の日と秋分の日に挟まれた火曜日）
  if (autumnalEquinox - keiroDay === 2) {
    add(9, keiroDay + 1)
  }

  add(10, getNthMonday(year, 10, 2)) // スポーツの日
  add(11, 3) // 文化の日
  add(11, 23) // 勤労感謝の日

  // 振替休日（祝日が日曜日の場合、以降の最も近い平日を休日にする）
  const baseList = Array.from(holidays).sort()

  for (const iso of baseList) {
    const d = parseLocalIsoDate(iso)

    if (d && d.getDay() === 0) {
      const sub = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)

      while (holidays.has(toIso(sub.getFullYear(), sub.getMonth() + 1, sub.getDate()))) {
        sub.setDate(sub.getDate() + 1)
      }
      holidays.add(toIso(sub.getFullYear(), sub.getMonth() + 1, sub.getDate()))
    }
  }

  nationalHolidayCache.set(year, holidays)

  return holidays
}

/**
 * 指定された日付（Date または YYYY-MM-DD）が日本の国民の祝日（振替休日・国民の休日含む）かどうかを判定する
 */
export const isJapaneseNationalHoliday = (dateInput: Date | string): boolean => {
  const d = typeof dateInput === 'string' ? parseLocalIsoDate(dateInput) : dateInput

  if (!d || isNaN(d.getTime())) return false

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const iso = `${year}-${month}-${day}`

  return buildJapaneseHolidaysForYear(year).has(iso)
}
