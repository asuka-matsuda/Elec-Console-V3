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

  // 関連データをトランザクション内で明示的・確実にカスケード削除（SQLiteの外部キー制約違反を防止）
  await prisma.$transaction(async (tx) => {
    await tx.circuit.deleteMany({ where: { siteId } })
    await tx.operationLog.deleteMany({ where: { siteId } })
    await tx.event.deleteMany({ where: { siteId } })
    await tx.siteSettings.deleteMany({ where: { siteId } })
    await tx.calendarSettings.deleteMany({ where: { siteId } })

    await tx.site.delete({
      where: { id: siteId },
    })
  })

  return { success: true }
})
