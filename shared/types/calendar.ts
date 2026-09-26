/**
 * 現場カレンダー関連の型定義
 * サーバーとクライアントの双方が参照する共有型定義です。
 */

/**
 * 現場カレンダーイベント（工程・点検・送電等の予定）
 */
export interface CalendarEvent {
  id: string
  siteId: string
  title: string
  start: string
  end?: string
  allDay?: boolean
  type?: string
}

/**
 * カレンダーイベント種別
 */
export interface EventType {
  id: string
  name: string
  /** CSS変数またはHEXカラー（例: 'var(--theme-accent)', '#00f0ff'） */
  color: string
  colorVar?: string
}

/**
 * カレンダーイベント登録・編集用フォームデータ
 */
export interface EventFormData {
  /** 予定タイトル */
  title: string
  /** イベント種別 (工程・点検・送電等) */
  type: string
  /** 開始日時 (YYYY-MM-DD または YYYY-MM-DDTHH:mm) */
  start: string
  /** 終了日時 */
  end: string
  /** 終日フラグ */
  allDay: boolean
}

/**
 * 現場カレンダー表示設定
 */
export interface CalendarSettings {
  siteId: string
  eventTypes: EventType[]
  /** 曜日のインデックス (0=日曜, 6=土曜) */
  holidayDays: number[]
  /** カスタム休日リスト (YYYY-MM-DD) */
  customHolidays: string[]
}

/**
 * 現場カレンダーの既定イベント種別リスト（単一真実源: SSoT）
 */
export const DEFAULT_CALENDAR_EVENT_TYPES: EventType[] = [
  { id: 'work', name: '現場作業', color: '#39c5cf' },
  { id: 'meeting', name: '打合せ', color: '#2f81f7' },
  { id: 'inspection', name: '立会検査', color: '#d29922' },
  { id: 'delivery', name: '納品・搬入', color: '#3fb950' },
]
