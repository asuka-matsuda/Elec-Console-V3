import { createError, defineEventHandler, getRouterParam } from 'h3'

import { requireAuthUser } from '../../../../../../utils/auth'
import { prisma } from '../../../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const siteId = getRouterParam(event, 'siteId')
  const circuitId = getRouterParam(event, 'id')

  if (!siteId || !circuitId) {
    throw createError({
      statusCode: 400,
      message: 'パラメータが不足しています',
    })
  }

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

  const updated = await prisma.circuit.update({
    where: { id: circuitId },
    data: {
      p1Kakunin: false,
      p1Mashishime: false,
      p1Worker: null,
      p1ConfirmedAt: null,
    },
  })

  await prisma.operationLog.create({
    data: {
      siteId,
      worker: workerName,
      action: 'フェーズ1 確定解除',
      targetBan: circuit.banMeisho,
      targetKairo: circuit.kairoBangou || circuit.kairoMeisho || '',
      details: '確定状態を解除しました',
    },
  })

  return {
    success: true,
    circuit: updated,
  }
})
