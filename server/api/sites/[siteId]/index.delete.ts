/**
 * 現場削除 API
 * DELETE /api/sites/:siteId
 *
 * @description 指定された現場および関連データを削除します。
 * @permission システム管理者限定
 */

import { defineEventHandler, getRouterParam } from 'h3'

import { requireAdminUser } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) return { success: false }

  await prisma.site.delete({ where: { id: siteId } })

  return { success: true }
})
