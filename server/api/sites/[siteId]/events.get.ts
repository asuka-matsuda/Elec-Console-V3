/**
 * 現場カレンダー予定取得 API
 * GET /api/sites/:siteId/events
 *
 * @description 指定現場に紐づくカレンダー予定イベント一覧を取得します。
 * @permission 現場アクセス権限
 */

import { defineEventHandler, getRouterParam } from 'h3'

import { requireSiteAccess } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireSiteAccess(event)

  try {
    const siteId = getRouterParam(event, 'siteId')

    if (!siteId) return []

    const events = await prisma.event.findMany({
      where: { siteId },
    })

    return events
  }
  catch (error) {
    console.error('API Error in events.get.ts:', error)

    return []
  }
})
