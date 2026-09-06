import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'

import { requireAuthUser } from '../../../../../utils/auth'
import { prisma } from '../../../../../utils/prisma'

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

  const body = await readBody(event)
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
      zetsuenR: body.rVal !== undefined ? (body.rVal === null ? null : parseFloat(body.rVal)) : circuit.zetsuenR,
      zetsuenS: body.sVal !== undefined ? (body.sVal === null ? null : parseFloat(body.sVal)) : circuit.zetsuenS,
      zetsuenT: body.tVal !== undefined ? (body.tVal === null ? null : parseFloat(body.tVal)) : circuit.zetsuenT,
      p2RStatus: body.rStatus !== undefined ? body.rStatus : circuit.p2RStatus,
      p2SStatus: body.sStatus !== undefined ? body.sStatus : circuit.p2SStatus,
      p2TStatus: body.tStatus !== undefined ? body.tStatus : circuit.p2TStatus,
      p2Remarks: body.remarks !== undefined ? body.remarks : circuit.p2Remarks,
      p2Worker: workerName,
      p2IsComplete: body.isComplete !== undefined ? Boolean(body.isComplete) : true,
      p2ConfirmedAt: new Date(),
    },
  })

  // ログ詳細テキスト
  const logDetails: string[] = []

  if (body.rStatus) logDetails.push(`R:${body.rStatus}${body.rVal ? `(${body.rVal}MΩ)` : ''}`)
  if (body.sStatus) logDetails.push(`S/N:${body.sStatus}${body.sVal ? `(${body.sVal}MΩ)` : ''}`)
  if (body.tStatus) logDetails.push(`T:${body.tStatus}${body.tVal ? `(${body.tVal}MΩ)` : ''}`)
  if (body.remarks) logDetails.push(`備考:${body.remarks}`)

  await prisma.operationLog.create({
    data: {
      siteId,
      worker: workerName,
      action: 'フェーズ2 確定',
      targetBan: circuit.banMeisho,
      targetKairo: circuit.kairoBangou || circuit.kairoMeisho || '',
      details: logDetails.join(' | ') || '絶縁抵抗測定完了',
    },
  })

  return {
    success: true,
    circuit: updated,
  }
})
