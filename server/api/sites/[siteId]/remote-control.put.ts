/**
 * 現場のリモコン設定保存 API
 * PUT /api/sites/:siteId/remote-control
 */

import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'

import type { RemoteControlConfig } from '../../../../shared/types/remoteControl'
import { requireSiteRole } from '../../../utils/auth'
import { serializeRemoteControlConfig } from '../../../utils/jsonFields'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireSiteRole(event, ['admin', 'worker'])

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createError({
      statusCode: 400,
      message: '現場IDが指定されていません',
    })
  }

  const body = await readBody<RemoteControlConfig>(event)

  const serialized = serializeRemoteControlConfig(body)

  await prisma.siteSettings.upsert({
    where: { siteId },
    update: {
      remoteControlConfig: serialized,
    },
    create: {
      siteId,
      remoteControlConfig: serialized,
    },
  })

  return {
    success: true,
    siteId,
    updatedAt: new Date().toISOString(),
  }
})
