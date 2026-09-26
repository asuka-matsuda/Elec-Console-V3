/**
 * データベースの JSON 文字列カラムに対する安全なシリアライズ／デシリアライズヘルパー。
 * 不正な JSON 文字列や破損データ、型違いが存在しても 500 エラーを起こさず安全にフォールバックします。
 */

interface CalendarEventType {
  id: string
  label: string
  color: string
  textColor?: string
  [key: string]: unknown
}

/**
 * 除外回路キーワード一覧（SiteSettings.excludedCircuits）の安全なパース
 */
export function parseExcludedCircuits(raw?: string | null): string[] {
  if (!raw || typeof raw !== 'string') {
    return []
  }

  try {
    const parsed = JSON.parse(raw)

    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map(item => item.trim())
    }

    return []
  }
  catch {
    // 万が一カンマ区切り文字列等が入っていた場合のフォールバック
    if (raw.includes(',')) {
      return raw.split(',').map(s => s.trim()).filter(Boolean)
    }

    return raw.trim() ? [raw.trim()] : []
  }
}

/**
 * 除外回路キーワード一覧の安全なシリアライズ
 */
export function serializeExcludedCircuits(val: unknown): string | null {
  if (val === null || val === undefined) {
    return null
  }

  if (Array.isArray(val)) {
    const cleaned = val
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map(item => item.trim())

    return cleaned.length > 0 ? JSON.stringify(cleaned) : null
  }

  if (typeof val === 'string') {
    const trimmed = val.trim()

    if (!trimmed) return null

    // 既に JSON 配列文字列か判定
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)

        if (Array.isArray(parsed)) {
          return JSON.stringify(parsed)
        }
      }
      catch {
        // パース失敗時は下へ
      }
    }

    return JSON.stringify([trimmed])
  }

  return null
}

/**
 * カレンダーイベント種別（CalendarSettings.eventTypes）の安全なパース
 */
export function parseEventTypes(raw?: string | null): CalendarEventType[] {
  if (!raw || typeof raw !== 'string') {
    return []
  }

  try {
    const parsed = JSON.parse(raw)

    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is CalendarEventType =>
        Boolean(item && typeof item === 'object' && 'id' in item && 'label' in item),
      )
    }

    return []
  }
  catch {
    return []
  }
}

/**
 * カレンダーイベント種別の安全なシリアライズ
 */
export function serializeEventTypes(val: unknown): string {
  if (Array.isArray(val)) {
    return JSON.stringify(val)
  }

  return '[]'
}

/**
 * 休業曜日番号（CalendarSettings.holidayDays）の安全なパース (0:日曜〜6:土曜)
 */
export function parseHolidayDays(raw?: string | null): number[] {
  if (!raw || typeof raw !== 'string') {
    return [0, 6] // デフォルト: 土日
  }

  try {
    const parsed = JSON.parse(raw)

    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is number => typeof item === 'number' && item >= 0 && item <= 6)
    }

    return [0, 6]
  }
  catch {
    return [0, 6]
  }
}

/**
 * 休業曜日番号の安全なシリアライズ
 */
export function serializeHolidayDays(val: unknown): string {
  if (Array.isArray(val)) {
    const nums = val.filter((item): item is number => typeof item === 'number' && item >= 0 && item <= 6)

    return JSON.stringify(nums)
  }

  return '[0, 6]'
}

/**
 * 特別休日リスト（CalendarSettings.customHolidays）の安全なパース ('YYYY-MM-DD')
 */
export function parseCustomHolidays(raw?: string | null): string[] {
  if (!raw || typeof raw !== 'string') {
    return []
  }

  try {
    const parsed = JSON.parse(raw)

    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    }

    return []
  }
  catch {
    return []
  }
}

/**
 * 特別休日リストの安全なシリアライズ
 */
export function serializeCustomHolidays(val: unknown): string {
  if (Array.isArray(val)) {
    return JSON.stringify(val.filter((item): item is string => typeof item === 'string' && item.trim().length > 0))
  }

  return '[]'
}

/**
 * 改行禁止ワードリスト（SiteSettings.noBreakWords）の安全なパース
 */
export function parseNoBreakWords(raw?: string | null): string[] {
  if (!raw || typeof raw !== 'string') {
    return []
  }

  try {
    const parsed = JSON.parse(raw)

    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map(item => item.trim())
    }

    return []
  }
  catch {
    if (raw.includes(',')) {
      return raw.split(',').map(s => s.trim()).filter(Boolean)
    }

    return raw.trim() ? [raw.trim()] : []
  }
}

/**
 * 改行禁止ワードリストの安全なシリアライズ
 */
export function serializeNoBreakWords(val: unknown): string | null {
  if (val === null || val === undefined) {
    return null
  }

  if (Array.isArray(val)) {
    const cleaned = val
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map(item => item.trim())

    return cleaned.length > 0 ? JSON.stringify(cleaned) : null
  }

  if (typeof val === 'string') {
    const trimmed = val.trim()

    if (!trimmed) return null

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)

        if (Array.isArray(parsed)) {
          return serializeNoBreakWords(parsed)
        }
      }
      catch {
        // fall through
      }
    }

    if (trimmed.includes(',')) {
      return serializeNoBreakWords(trimmed.split(',').map(s => s.trim()))
    }

    return JSON.stringify([trimmed])
  }

  return null
}
