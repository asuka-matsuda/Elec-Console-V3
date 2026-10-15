/**
 * 送電試験全体進捗統計取得 API
 * GET /api/sites/:siteId/souden/stats
 *
 * @description 各フェーズの完了件数、進捗率、系統別集計データをリアルタイム算出して返却します。
 * @permission 現場アクセス権限
 */

import { defineEventHandler, getRouterParam } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireSiteAccess } from '../../../../utils/auth'
import { createAppError } from '../../../../utils/error'
import { getSoudenStats } from '../../../../utils/stats'

export default defineEventHandler(async (event) => {
  await requireSiteAccess(event)

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: '現場IDが指定されていません',
    })
  }

  return getSoudenStats(siteId)
})
