import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'

import { requireSiteAccess } from '../../../../../../utils/auth'
import { atomicUpdateCircuit } from '../../../../../../utils/optimisticLock'
import { prisma } from '../../../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireSiteAccess(event)
  const siteId = getRouterParam(event, 'siteId')
  const circuitId = getRouterParam(event, 'id')

  if (!siteId || !circuitId) {
    throw createError({
      statusCode: 400,
      message: 'パラメータが不足しています',
    })
  }

  const body = await readBody(event).catch(() => ({}))
  const workerName = `${user.lastName} ${user.firstName}`.trim() || user.loginId

  const updated = await atomicUpdateCircuit({
    circuitId,
    siteId,
    expectedVersion: typeof body?.expectedVersion === 'number' ? body.expectedVersion : undefined,
    expectedUpdatedAt: body?.expectedUpdatedAt,
    data: {
      zetsuenR: null,
      zetsuenS: null,
      zetsuenT: null,
      p2RStatus: null,
      p2SStatus: null,
      p2TStatus: null,
      p2Worker: null,
      p2ConfirmedAt: null,
      p2IsComplete: false,
    },
  })

  const clearedAt = body?.clientConfirmedAt ? new Date(body.clientConfirmedAt) : new Date()

  await prisma.operationLog.create({
    data: {
      siteId,
      worker: workerName,
      timestamp: clearedAt,
      action: body?.isOfflineSync ? 'フェーズ2 解除 (オフライン同期)' : 'フェーズ2 解除',
      targetBan: updated.banMeisho,
      targetKairo: updated.kairoBangou || updated.kairoMeisho || '',
      details: body?.isOfflineSync
        ? `フェーズ2の確定状態を解除しました [同期: ${new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}]`
        : 'フェーズ2の確定状態を解除しました',
    },
  })

  return {
    success: true,
    circuit: updated,
  }
})
