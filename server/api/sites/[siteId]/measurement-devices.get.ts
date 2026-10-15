/**
 * 現場の測定機器一覧および選択状態取得 API
 * GET /api/sites/:siteId/measurement-devices
 */

import { defineEventHandler, getRouterParam } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireSiteAccess } from '../../../utils/auth'
import { createAppError } from '../../../utils/error'
import { parseMeasurementDevices, parseSelectedDeviceIds } from '../../../utils/jsonFields'
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

  const settings = await prisma.siteSettings.findUnique({
    where: { siteId },
    select: {
      measurementDevices: true,
      selectedDeviceIds: true,
    },
  })

  return {
    devices: parseMeasurementDevices(settings?.measurementDevices),
    selectedDeviceIds: parseSelectedDeviceIds(settings?.selectedDeviceIds),
  }
})
