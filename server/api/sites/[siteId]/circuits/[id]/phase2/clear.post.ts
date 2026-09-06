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

  await prisma.operationLog.create({
    data: {
      siteId,
      worker: workerName,
      action: 'フェーズ2 解除',
      targetBan: circuit.banMeisho,
      targetKairo: circuit.kairoBangou || circuit.kairoMeisho || '',
      details: 'フェーズ2の確定状態を解除しました',
    },
  })

  return {
    success: true,
    circuit: updated,
  }
})
