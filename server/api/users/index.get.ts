/**
 * ユーザー一覧取得 API
 * GET /api/users
 *
 * @description 登録されている全ユーザーの一覧および担当現場情報を取得します。
 * @permission マスター管理者限定
 */

import { defineEventHandler } from 'h3'

import { requireMasterUser, toSafeUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireMasterUser(event)

  const users = await prisma.user.findMany({
    include: { assignedSites: true, siteAssignments: true },
  })

  return users.map(toSafeUser)
})
