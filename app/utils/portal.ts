import type { User } from '~/types/auth'

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
export const getSiteStatusColor = (status: unknown): string => {
  switch (status) {
    case 'planning':
      return 'var(--color-text-muted)'
    case 'in_progress':
      return 'var(--color-status-warning)'
    case 'completed':
      return 'var(--color-status-success)'
    case 'on_hold':
      return 'var(--color-status-danger)'
    default:
      return 'var(--color-text-muted)'
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
