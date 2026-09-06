import { createError, defineEventHandler, getRouterParam } from 'h3'

import { requireAuthUser } from '../../../../utils/auth'
import { getSoudenStats } from '../../../../utils/stats'

export default defineEventHandler(async (event) => {
  await requireAuthUser(event)

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
