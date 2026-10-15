/**
 * カレンダーイベント削除 API
 * DELETE /api/events/:id
 *
 * @description 指定された予定イベントを削除します。
 * @permission 現場アクセス権限
 */

import { defineEventHandler, getRouterParam } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireSiteRole } from '../../utils/auth'
import { createAppError } from '../../utils/error'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: 'イベントIDが指定されていません。',
    })
  }

  const existingEvent = await prisma.event.findUnique({
    where: { id },
  })

  if (!existingEvent) {
    throw createAppError({
      code: ErrorCode.SYS_NOT_FOUND,
      message: '指定されたイベントが見つかりません。',
    })
  }

  // 現場アクセス権・ロール（admin / worker）および現場有効状態を検証
  await requireSiteRole(event, ['admin', 'worker'], existingEvent.siteId)

  await prisma.event.delete({
    where: { id },
  })

  return { success: true }
})
