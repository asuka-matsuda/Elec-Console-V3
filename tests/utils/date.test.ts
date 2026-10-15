import {
  adjustDateRangeForAllDay,
  calculateAutoEndDate,
  calculateRemainingWorkingDays,
  expandDateRange,
  formatDate,
  formatDateTime,
  formatDateWithWeekday,
  formatShortDateTime,
  formatTime,
  formatToDateInputString,
  getTodayDateInput,
  isJapaneseNationalHoliday,
} from '../../app/utils/date'
import { formatSyncTimeString } from '../../server/utils/date'

describe('date utils', () => {
  it('formatDate should format valid dates as YYYY/MM/DD', () => {
    const d = new Date(2026, 7, 31) // 2026-08-31

    expect(formatDate(d)).toBe('2026/08/31')
    expect(formatDate('2026-08-31T00:00:00Z')).toBe('2026/08/31')
  })

  it('formatDate should return fallback on invalid or empty date', () => {
    expect(formatDate(null)).toBe('-')
    expect(formatDate(undefined)).toBe('-')
    expect(formatDate('invalid-date')).toBe('-')
    expect(formatDate(null, 'N/A')).toBe('N/A')
  })

  it('formatDateTime should format valid dates as YYYY/MM/DD HH:mm', () => {
    const d = new Date(2026, 7, 31, 9, 5, 23) // 2026-08-31 09:05:23

    expect(formatDateTime(d)).toBe('2026/08/31 09:05')
    expect(formatDateTime(d, '-', { withSeconds: true })).toBe('2026/08/31 09:05:23')
  })

  it('formatShortDateTime should format valid dates as MM/DD HH:mm', () => {
    const d = new Date(2026, 7, 31, 9, 5) // 2026-08-31 09:05

    expect(formatShortDateTime(d)).toBe('08/31 09:05')
    expect(formatShortDateTime(null)).toBe('-')
    expect(formatShortDateTime('invalid-date')).toBe('-')
  })

  it('formatTime should format valid times as HH:mm', () => {
    const d = new Date(2026, 7, 31, 14, 30)

    expect(formatTime(d)).toBe('14:30')
  })

  it('formatSyncTimeString should format sync times safely with fallback', () => {
    const d = new Date(2026, 7, 31, 9, 5)

    expect(formatSyncTimeString(d)).toBe('09:05')
    expect(formatSyncTimeString(null)).toBe('--:--')
    expect(formatSyncTimeString('invalid')).toBe('--:--')
  })

  it('formatToDateInputString should format Date as YYYY-MM-DD', () => {
    const d = new Date(2026, 8, 19) // 2026-09-19

    expect(formatToDateInputString(d)).toBe('2026-09-19')
    expect(formatToDateInputString('2026-09-19T10:00:00Z')).toBe('2026-09-19')
    expect(formatToDateInputString(null)).toBe('')
    expect(formatToDateInputString(undefined, '2026-01-01')).toBe('2026-01-01')
  })

  it('getTodayDateInput should return valid YYYY-MM-DD pattern', () => {
    expect(getTodayDateInput()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  describe('calculateAutoEndDate', () => {
    it('should set end to same day for all-day events', () => {
      expect(calculateAutoEndDate('2026-09-05', '', true)).toBe('2026-09-05')
      expect(calculateAutoEndDate('2026-09-05T09:00', '', true)).toBe('2026-09-05')
    })

    it('should add 1 hour for timed events when end is empty', () => {
      expect(calculateAutoEndDate('2026-09-05T10:00', '', false)).toBe('2026-09-05T11:00')
    })

    it('should preserve valid end if it is after start', () => {
      expect(calculateAutoEndDate('2026-09-05T10:00', '2026-09-05T12:00', false)).toBe('2026-09-05T12:00')
    })

    it('should correct end if it is before start', () => {
      expect(calculateAutoEndDate('2026-09-05T10:00', '2026-09-05T08:00', false)).toBe('2026-09-05T11:00')
    })
  })

  describe('adjustDateRangeForAllDay', () => {
    it('should strip time when switching to all-day', () => {
      const result = adjustDateRangeForAllDay('2026-09-05T10:00', '2026-09-05T12:00', true)

      expect(result.start).toBe('2026-09-05')
      expect(result.end).toBe('2026-09-05')
    })

    it('should add default times when switching from all-day to timed', () => {
      const result = adjustDateRangeForAllDay('2026-09-05', '2026-09-05', false)

      expect(result.start).toBe('2026-09-05T09:00')
      expect(result.end).toBe('2026-09-05T10:00')
    })
  })

  describe('calculateRemainingWorkingDays', () => {
    it('returns -1 for past dates and 0 for today', () => {
      expect(calculateRemainingWorkingDays('2026-10-15', '2026-10-14', [0, 6], [])).toBe(-1)
      expect(calculateRemainingWorkingDays('2026-10-15', '2026-10-15', [0, 6], [])).toBe(0)
    })

    it('counts only working days excluding weekly holidayDays and customHolidays', () => {
      // 2026-10-15 is Thursday, 2026-10-20 is Tuesday
      // Dates in (10/15, 10/20]: 10/16(Fri), 10/17(Sat), 10/18(Sun), 10/19(Mon), 10/20(Tue)
      // With Sat/Sun [0, 6] off -> 3 working days (10/16, 10/19, 10/20)
      expect(calculateRemainingWorkingDays('2026-10-15', '2026-10-20', [0, 6], [])).toBe(3)

      // If Saturday is a working day (only Sunday [0] is holiday) -> 4 working days
      expect(calculateRemainingWorkingDays('2026-10-15', '2026-10-20', [0], [])).toBe(4)

      // If 2026-10-19 (Mon) is a custom holiday -> 2 working days (10/16, 10/20)
      expect(calculateRemainingWorkingDays('2026-10-15', '2026-10-20', [0, 6], ['2026-10-19'])).toBe(2)
    })
  })

  describe('expandDateRange & formatDateWithWeekday', () => {
    it('expands single date or date range into YYYY-MM-DD array', () => {
      expect(expandDateRange('2026-08-13')).toEqual(['2026-08-13'])
      expect(expandDateRange('2026-08-13', '2026-08-15')).toEqual([
        '2026-08-13',
        '2026-08-14',
        '2026-08-15',
      ])
    })

    it('formats YYYY-MM-DD with Japanese weekday', () => {
      expect(formatDateWithWeekday('2026-10-15')).toBe('2026/10/15 (木)')
    })
  })

  describe('isJapaneseNationalHoliday', () => {
    it('detects fixed holidays, Happy Mondays, equinoxes, substitute holidays, and citizens holidays', () => {
      expect(isJapaneseNationalHoliday('2026-01-01')).toBe(true) // 元日
      expect(isJapaneseNationalHoliday('2026-01-12')).toBe(true) // 成人の日 (第2月曜)
      expect(isJapaneseNationalHoliday('2026-03-20')).toBe(true) // 春分の日
      expect(isJapaneseNationalHoliday('2026-05-06')).toBe(true) // 振替休日 (5/3日曜の振替)
      expect(isJapaneseNationalHoliday('2026-09-21')).toBe(true) // 敬老の日
      expect(isJapaneseNationalHoliday('2026-09-22')).toBe(true) // 国民の休日 (シルバーウィーク)
      expect(isJapaneseNationalHoliday('2026-09-23')).toBe(true) // 秋分の日
      expect(isJapaneseNationalHoliday('2026-10-12')).toBe(true) // スポーツの日
      expect(isJapaneseNationalHoliday('2026-10-15')).toBe(false) // 通常平日
    })
  })
})
