/**
 * 送電試験全体進捗統計取得 API
 * GET /api/sites/:siteId/souden/stats
 *
 * @description 各フェーズの完了件数、進捗率、系統別集計データをリアルタイム算出して返却します。
 * @permission 現場アクセス権限
 */

import { createError, defineEventHandler, getRouterParam } from 'h3'

import { requireSiteAccess } from '../../../../utils/auth'
import { getSoudenStats } from '../../../../utils/stats'

export default defineEventHandler(async (event) => {
  await requireSiteAccess(event)

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createError({
      statusCode: 400,
      message: '現場IDが指定されていません',
    })
  }

  const stats = await getSoudenStats(siteId)

  return stats
})
