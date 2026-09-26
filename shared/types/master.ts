/**
 * システム管理・マスタ設定・ダッシュボード型定義
 *
 * お知らせ、システム更新履歴、改行禁止ワードおよびダッシュボード集約データの型を提供します。
 */

/** システムお知らせ用アイテム定義 */
export interface AnnouncementItem {
  id?: number | string
  title: string
  date: string
  desc: string
}

/** システム更新履歴・リリースノート用アイテム定義 */
export interface HistoryItem {
  id?: number | string
  version: string
  title: string
  date: string
  desc: string
  status?: string
}

/** 改行禁止ワード設定用アイテム定義 */
export interface WordBreakItem {
  id?: string | number
  word: string
  date: string
}

/** ダッシュボード用集約データ */
export interface DashboardData {
  announcements: AnnouncementItem[]
  history: HistoryItem[]
}
