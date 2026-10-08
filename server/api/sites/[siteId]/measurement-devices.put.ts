/**
 * 現場の測定機器一覧および選択状態更新 API
 * PUT /api/sites/:siteId/measurement-devices
 */

import { createError, defineEventHandler, getRouterParam } from 'h3'
import { z } from 'zod'

import { requireSiteRole } from '../../../utils/auth'
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
    throw createError({
      statusCode: 400,
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

  let devices = []
  let selectedDeviceIds = {}

  if (settings.measurementDevices) {
    try {
      devices = JSON.parse(settings.measurementDevices)
    }
    catch {
      devices = []
    }
  }

  if (settings.selectedDeviceIds) {
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
