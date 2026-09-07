import { defineEventHandler, getRouterParam, readBody } from 'h3'

import { requireAdminUser } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const siteId = getRouterParam(event, 'siteId')
  const body = await readBody(event)

  if (!siteId) return null

  const siteData = body.site || body

  const updatedSite = await prisma.site.update({
    where: { id: siteId },
    data: {
      name: siteData.name,
      status: siteData.status,
      disabledAt: siteData.disabledAt !== undefined
        ? (siteData.disabledAt ? new Date(siteData.disabledAt) : null)
        : undefined,
    },
  })

  const rawExcelPath = siteData.excelPath !== undefined
    ? siteData.excelPath
    : body.settings?.excelPath

  const newExcelPath = typeof rawExcelPath === 'string'
    ? rawExcelPath.trim().replace(/^["']+|["']+$/g, '').trim()
    : rawExcelPath

  const newExcluded = siteData.excludedCircuits !== undefined
    ? (Array.isArray(siteData.excludedCircuits)
        ? JSON.stringify(siteData.excludedCircuits)
        : siteData.excludedCircuits)
    : (body.settings?.excludedCircuits !== undefined
        ? (Array.isArray(body.settings.excludedCircuits)
            ? JSON.stringify(body.settings.excludedCircuits)
            : body.settings.excludedCircuits)
        : undefined)

  const settingsUpdates: Record<string, unknown> = {}

  if (newExcelPath !== undefined) settingsUpdates.excelPath = newExcelPath
  if (newExcluded !== undefined) settingsUpdates.excludedCircuits = newExcluded
  if (body.settings?.phase2ThresholdMegOhm !== undefined) {
    settingsUpdates.phase2ThresholdMegOhm = body.settings.phase2ThresholdMegOhm
  }
  if (body.settings?.enablePhase3 !== undefined) {
    settingsUpdates.enablePhase3 = body.settings.enablePhase3
  }

  const settings = Object.keys(settingsUpdates).length > 0
    ? await prisma.siteSettings.upsert({
        where: { siteId },
        create: {
          siteId,
          ...settingsUpdates,
        },
        update: settingsUpdates,
      })
    : await prisma.siteSettings.findUnique({
        where: { siteId },
      })

  let parsedExcluded: string[] = []

  if (settings?.excludedCircuits) {
    try {
      parsedExcluded = JSON.parse(settings.excludedCircuits)
    }
    catch {
      parsedExcluded = []
    }
  }

  const returnedSite = {
    ...updatedSite,
    excelPath: settings?.excelPath || undefined,
    excludedCircuits: parsedExcluded,
  }

  return { site: returnedSite, settings }
})
