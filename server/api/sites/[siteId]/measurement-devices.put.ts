/**
 * 現場の測定機器一覧および選択状態更新 API
 * PUT /api/sites/:siteId/measurement-devices
 */

import { defineEventHandler, getRouterParam } from 'h3'
import { z } from 'zod'

import { ErrorCode } from '#shared/types/errors'

import { requireSiteRole } from '../../../utils/auth'
import { createAppError } from '../../../utils/error'
import { parseMeasurementDevices, parseSelectedDeviceIds } from '../../../utils/jsonFields'
import { prisma } from '../../../utils/prisma'
import { validateRequestBody } from '../../../utils/validation'

const UpdateMeasurementDevicesSchema = z.object({
  devices: z.array(z.record(z.string(), z.unknown())).optional(),
  selectedDeviceIds: z.record(z.string(), z.unknown()).optional(),
})

export default defineEventHandler(async (event) => {
  await requireSiteRole(event, ['admin', 'worker'])

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: '現場IDが指定されていません',
    })
  }

  const body = await validateRequestBody(event, UpdateMeasurementDevicesSchema)

  const updateData: {
    measurementDevices?: string
    selectedDeviceIds?: string
  } = {}

  if (body.devices !== undefined) {
    updateData.measurementDevices = JSON.stringify(body.devices)
  }

  if (body.selectedDeviceIds !== undefined) {
    updateData.selectedDeviceIds = JSON.stringify(body.selectedDeviceIds)
  }

  const settings = await prisma.siteSettings.upsert({
    where: { siteId },
    create: {
      siteId,
      ...updateData,
    },
    update: updateData,
  })

  return {
    devices: parseMeasurementDevices(settings.measurementDevices),
    selectedDeviceIds: parseSelectedDeviceIds(settings.selectedDeviceIds),
  }
})
