/**
 * ユーザー一覧取得 API
 * GET /api/users
 *
 * @description 登録されている全ユーザーの一覧および担当現場情報を取得します。
 * @permission システム管理者限定
 */

import { defineEventHandler } from 'h3'

import { requireAdminUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const users = await prisma.user.findMany({
    include: { assignedSites: true, siteAssignments: true },
  })

  return users.map((user) => {
    const assignedSiteIds = user.assignedSites.map(s => s.id)
    const siteAssignments = user.assignedSites.map((s) => {
      const match = user.siteAssignments.find(sa => sa.siteId === s.id)

      return {
        siteId: s.id,
        role: match?.role || user.role || 'worker',
      }
    })
    const { password: _dbPassword, assignedSites: _assignedSites, siteAssignments: _sa, ...restUser } = user

    return { ...restUser, assignedSiteIds, siteAssignments }
  })
})
