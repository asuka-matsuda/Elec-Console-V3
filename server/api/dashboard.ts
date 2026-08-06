export interface Announcement {
  title: string
  date: string
  desc: string
}

export interface HistoryItem {
  version: string
  title: string
  date: string
  desc: string
  badgeClass: string
}

export interface DashboardData {
  announcements: Announcement[]
  history: HistoryItem[]
}

export default defineEventHandler((): DashboardData => {
  return {
    announcements: [
      { title: 'システムメンテナンスのお知らせ', date: '2026.08.01', desc: '深夜2時から4時まで停止します。' },
      { title: '新しいツール「ケーブル重量概算」をリリース', date: '2026.07.15', desc: '木製ドラムの選定がより簡単になりました。' }
    ],
    history: [
      { version: 'v2.1.0', title: 'ダッシュボードのUIリニューアル', date: '2026.08.06', desc: 'サイバーテーマへ移行しました。', badgeClass: 'c-badge--success' },
      { version: 'v2.0.5', title: '軽微なバグ修正', date: '2026.07.20', desc: '配管計算の数値を一部修正。', badgeClass: 'c-badge--secondary' }
    ]
  }
})
