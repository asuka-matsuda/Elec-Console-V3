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
      return Array.from(
        new Set(
          parsed
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .map(item => item.trim()),
        ),
      )
    }

    return []
  }
  catch {
    const trimmed = raw.trim()

    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      return []
    }

    // 万が一カンマ区切り文字列等が入っていた場合のフォールバック
    if (raw.includes(',')) {
      return Array.from(new Set(raw.split(',').map(s => s.trim()).filter(Boolean)))
    }

    return trimmed ? [trimmed] : []
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
    const cleaned = Array.from(
      new Set(
        val
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .map(item => item.trim()),
      ),
    )

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
 * 改行禁止ワードリスト（SiteSettings.noBreakWords / SystemSetting.no_break_words）の安全なパース
 */
export function parseNoBreakWords(raw?: string | null): string[] {
  if (!raw || typeof raw !== 'string') {
    return []
  }

  try {
    const parsed = JSON.parse(raw)

    if (Array.isArray(parsed)) {
      const cleaned = parsed
        .filter((item): item is string => typeof item === 'string')
        .map(item => item.trim())
        .filter(item => item.length > 0 && item.length <= 100)

      return Array.from(new Set(cleaned))
    }

    return []
  }
  catch {
    if (raw.includes(',')) {
      const cleaned = raw
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0 && s.length <= 100)

      return Array.from(new Set(cleaned))
    }

    const trimmed = raw.trim()

    return trimmed.length > 0 && trimmed.length <= 100 ? [trimmed] : []
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
    const cleaned = Array.from(
      new Set(
        val
          .filter((item): item is string => typeof item === 'string')
          .map(item => item.trim())
          .filter(item => item.length > 0 && item.length <= 100),
      ),
    )

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

    return trimmed.length <= 100 ? JSON.stringify([trimmed]) : null
  }

  return null
}

/**
 * リモコン設定（SiteSettings.remoteControlConfig）の安全なパース
 */
export function parseRemoteControlConfig(raw?: string | null): {
  assignments: Record<string, { groups: number[], patterns: string[], relayNumber?: string }>
  groupRemarks?: Record<string, string>
  patternRemarks?: Record<string, string>
} {
  const defaultVal = { assignments: {}, groupRemarks: {}, patternRemarks: {} }

  if (!raw || typeof raw !== 'string') {
    return defaultVal
  }

  try {
    const parsed = JSON.parse(raw)

    if (parsed && typeof parsed === 'object') {
      return {
        assignments: parsed.assignments && typeof parsed.assignments === 'object' ? parsed.assignments : {},
        groupRemarks: parsed.groupRemarks && typeof parsed.groupRemarks === 'object' ? parsed.groupRemarks : {},
        patternRemarks: parsed.patternRemarks && typeof parsed.patternRemarks === 'object' ? parsed.patternRemarks : {},
      }
    }

    return defaultVal
  }
  catch {
    return defaultVal
  }
}

/**
 * リモコン設定の安全なシリアライズ
 */
export function serializeRemoteControlConfig(val: unknown): string | null {
  if (!val || typeof val !== 'object') {
    return null
  }
  try {
    return JSON.stringify(val)
  }
  catch {
    return null
  }
}

const DEFAULT_ASSIGNED_REPORTS = ['tag', 'socket-tepra', 'exam', 'remote']

/**
 * 現場割り当て帳票（SiteSettings.assignedReports）の安全なパース
 * 未設定（null / undefined / 空文字）の場合はデフォルト全帳票を返し、
 * 明示的に空配列（"[]"）が保存されている場合は空配列 [] を返す
 */
export function parseAssignedReports(raw?: string | null): string[] {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return [...DEFAULT_ASSIGNED_REPORTS]
  }

  try {
    const parsed = JSON.parse(raw)

    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map(item => item.trim())
    }

    return [...DEFAULT_ASSIGNED_REPORTS]
  }
  catch {
    return [...DEFAULT_ASSIGNED_REPORTS]
  }
}

/**
 * 現場割り当て帳票の安全なシリアライズ
 */
export function serializeAssignedReports(val: unknown): string | null {
  if (val === null || val === undefined) {
    return null
  }

  if (Array.isArray(val)) {
    const cleaned = val
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map(item => item.trim())

    return JSON.stringify(cleaned)
  }

  return null
}

/**
 * 試験用計測器リスト（SiteSettings.measurementDevices）の安全なパース
 */
export function parseMeasurementDevices<T = Record<string, unknown>>(raw?: string | null): T[] {
  if (!raw || typeof raw !== 'string') {
    return []
  }

  try {
    const parsed = JSON.parse(raw)

    return Array.isArray(parsed) ? (parsed as T[]) : []
  }
  catch {
    return []
  }
}

/**
 * 選択済み計測器IDマップ（SiteSettings.selectedDeviceIds）の安全なパース
 */
export function parseSelectedDeviceIds<T extends Record<string, unknown> = Record<string, string | null>>(raw?: string | null): T {
  if (!raw || typeof raw !== 'string') {
    return {} as T
  }

  try {
    const parsed = JSON.parse(raw)

    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as T) : ({} as T)
  }
  catch {
    return {} as T
  }
}
