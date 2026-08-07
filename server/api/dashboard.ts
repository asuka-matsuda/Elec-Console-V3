import announcementsData from '../data/announcements.json'
import historyData from '../data/history.json'

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
  status: 'success' | 'neutral'
}

export interface DashboardData {
  announcements: Announcement[]
  history: HistoryItem[]
}

export default defineEventHandler((): DashboardData => {
  return {
    announcements: announcementsData as Announcement[],
    history: historyData as HistoryItem[]
  }
})
