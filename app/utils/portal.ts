import type { User } from '~/types/auth'
import type { BadgeColor } from '~/types/components'

/**
 * 現場ステータスに対応する表示ラベルを取得する
 */
export const getSiteStatusLabel = (status: unknown): string => {
  switch (status) {
    case 'planning':
      return '計画中'
    case 'in_progress':
      return '進行中'
    case 'completed':
      return '完了'
    case 'on_hold':
      return '保留'
    default:
      return '不明'
  }
}

/**
 * 現場ステータスに対応するバッジカラーを取得する
 */
export const getSiteStatusColor = (status: unknown): BadgeColor => {
  switch (status) {
    case 'planning':
      return 'secondary'
    case 'in_progress':
      return 'warning'
    case 'completed':
      return 'success'
    case 'on_hold':
      return 'danger'
    default:
      return 'secondary'
  }
}

/**
 * 現場IDにアサインされているワーカーのフルネーム一覧を取得する
 */
export const getAssignedWorkerNames = (
  siteId: string | undefined | null,
  users: User[] | undefined | null,
): string[] => {
  if (!siteId || !users || users.length === 0) return []

  const assigned = users.filter(
    u => u.assignedSiteIds && u.assignedSiteIds.includes(siteId),
  )

  return assigned.map(u => `${u.lastName} ${u.firstName}`)
}
