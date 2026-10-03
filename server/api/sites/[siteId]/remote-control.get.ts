/**
 * 現場のリモコン設定取得 API
 * GET /api/sites/:siteId/remote-control
 */

import { createError, defineEventHandler, getRouterParam } from 'h3'

import { requireSiteAccess } from '../../../utils/auth'
import { loadSiteRemoteCircuits } from '../../../utils/excel/remoteCircuits'
import { parseRemoteControlConfig } from '../../../utils/jsonFields'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireSiteAccess(event)

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createError({
      statusCode: 400,
      message: '現場IDが指定されていません',
    })
  }

  const settings = await prisma.siteSettings.findUnique({
    where: { siteId },
    select: {
      remoteControlConfig: true,
      excelPath: true,
    },
  })

  const config = parseRemoteControlConfig(settings?.remoteControlConfig)
  const circuits = await loadSiteRemoteCircuits(siteId, settings?.excelPath)

  return {
    success: true,
    config,
    circuits,
    hasExcelPath: Boolean(settings?.excelPath),
  }
})
