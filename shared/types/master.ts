/**
 * システム管理・マスタ設定・ダッシュボード型定義
 *
 * お知らせ、システム更新履歴およびダッシュボード集約データの型を提供します。
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

/** ダッシュボード用集約データ */
export interface DashboardData {
  announcements: AnnouncementItem[]
  history: HistoryItem[]
}
