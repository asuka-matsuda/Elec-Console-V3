import {
  adjustDateRangeForAllDay,
  calculateAutoEndDate,
  formatDate,
  formatDateTime,
  formatTime,
} from '../../app/utils/date'

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
    const d = new Date(2026, 7, 31, 9, 5) // 2026-08-31 09:05

    expect(formatDateTime(d)).toBe('2026/08/31 09:05')
  })

  it('formatTime should format valid times as HH:mm', () => {
    const d = new Date(2026, 7, 31, 14, 30)

    expect(formatTime(d)).toBe('14:30')
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
})
