/**
 * マスター更新履歴一覧取得 API
 * GET /api/master/history
 *
 * @description 管理者向けに更新履歴（リリースノート）一覧を全件取得します。
 * @permission システム管理者限定
 */

import { defineEventHandler } from 'h3'

import { requireMasterUser } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireMasterUser(event)

  return await prisma.history.findMany({
    orderBy: { createdAt: 'desc' },
  })
})
