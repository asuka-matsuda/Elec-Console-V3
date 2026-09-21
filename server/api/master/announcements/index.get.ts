/**
 * マスターお知らせ一覧取得 API
 * GET /api/master/announcements
 *
 * @description 管理者向けにお知らせ一覧を全件取得します。
 * @permission システム管理者限定
 */

import { defineEventHandler } from 'h3'

import { requireMasterUser } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireMasterUser(event)

  return await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
  })
})
