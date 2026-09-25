/**
 * 現場の測定機器一覧および選択状態取得 API
 * GET /api/sites/:siteId/measurement-devices
 */

import { createError, defineEventHandler, getRouterParam } from 'h3'

import { requireSiteAccess } from '../../../utils/auth'
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
      measurementDevices: true,
      selectedDeviceIds: true,
    },
  })

  let devices = []
  let selectedDeviceIds = {}

  if (settings?.measurementDevices) {
    try {
      devices = JSON.parse(settings.measurementDevices)
    }
    catch {
      devices = []
    }
  }

  if (settings?.selectedDeviceIds) {
    try {
      selectedDeviceIds = JSON.parse(settings.selectedDeviceIds)
    }
    catch {
      selectedDeviceIds = {}
    }
  }

  return {
    devices,
    selectedDeviceIds,
  }
})
