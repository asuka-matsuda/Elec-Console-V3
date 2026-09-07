import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'

import { requireSiteAccess } from '../../../../../../utils/auth'
import { checkOptimisticLock } from '../../../../../../utils/optimisticLock'
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

  const circuit = await prisma.circuit.findFirst({
    where: { id: circuitId, siteId },
  })

  if (!circuit) {
    throw createError({
      statusCode: 404,
      message: '指定された回路が見つかりません',
    })
  }

  checkOptimisticLock(circuit, body?.expectedUpdatedAt)

  const updated = await prisma.circuit.update({
    where: { id: circuitId },
    data: {
      denatsuRs: null,
      denatsuSt: null,
      denatsuRt: null,
      kensou: null,
      p3Worker: null,
      p3ConfirmedAt: null,
    },
  })

  const clearedAt = body?.clientConfirmedAt ? new Date(body.clientConfirmedAt) : new Date()

  await prisma.operationLog.create({
    data: {
      siteId,
      worker: workerName,
      timestamp: clearedAt,
      action: body?.isOfflineSync ? 'フェーズ3 解除 (オフライン同期)' : 'フェーズ3 解除',
      targetBan: circuit.banMeisho,
      targetKairo: circuit.kairoBangou || circuit.kairoMeisho || '',
      details: body?.isOfflineSync
        ? `フェーズ3の確定状態を解除しました [同期: ${new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}]`
        : 'フェーズ3の確定状態を解除しました',
    },
  })

  return {
    success: true,
    circuit: updated,
  }
})
