/**
 * 現場ポータル担当者抽出ユーティリティ
 *
 * 現場IDにアサインされている担当作業員・管理者の氏名抽出ヘルパーを提供します。
 */

import type { User } from '#shared/types/auth'

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
