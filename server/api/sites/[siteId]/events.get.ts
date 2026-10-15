/**
 * 現場カレンダー予定取得 API
 * GET /api/sites/:siteId/events
 *
 * @description 指定現場に紐づくカレンダー予定イベント一覧を取得します。
 * @permission 現場アクセス権限
 */

import { defineEventHandler, getRouterParam } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireSiteAccess } from '../../../utils/auth'
import { createAppError } from '../../../utils/error'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireSiteAccess(event)

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: '現場IDが指定されていません',
    })
  }

  const rows = await prisma.event.findMany({
    where: { siteId },
  })

  return rows.map(row => ({
    ...row,
    isMilestone: Boolean(row.isMilestone || row.type === 'milestone'),
  }))
})
