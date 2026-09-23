/**
 * 現場削除 API
 * DELETE /api/sites/:siteId
 *
 * @description 指定された現場および関連データ（設定、カレンダー、回路、操作ログ等）を完全に削除します。
 * @permission システム管理者限定
 */

import { createError, defineEventHandler, getRouterParam } from 'h3'

import { requireAdminUser } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createError({
      statusCode: 400,
      message: '現場IDが指定されていません。',
    })
  }

  const existing = await prisma.site.findUnique({
    where: { id: siteId },
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '削除対象の現場が見つかりません。',
    })
  }

  // 関連データを含めてカスケード削除
  await prisma.site.delete({
    where: { id: siteId },
  })

  return { success: true }
})
