/**
 * 現場の測定機器一覧および選択状態更新 API
 * PUT /api/sites/:siteId/measurement-devices
 */

import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'

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

  const body = await readBody(event)

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
