/**
 * 現場のテプラ用回路一覧取得 API
 * GET /api/sites/:siteId/tepra-circuits
 */

import { createError, defineEventHandler, getRouterParam } from 'h3'

import { requireSiteAccess } from '../../../utils/auth'
import { loadSiteTepraCircuits } from '../../../utils/excel/tepraCircuits'
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
      excelPath: true,
    },
  })

  const circuits = await loadSiteTepraCircuits(siteId, settings?.excelPath)

  return {
    success: true,
    circuits,
    hasExcelPath: Boolean(settings?.excelPath),
  }
})
