import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'

import { requireSiteAccess } from '../../../../../utils/auth'
import { checkOptimisticLock } from '../../../../../utils/optimisticLock'
import { prisma } from '../../../../../utils/prisma'

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

  checkOptimisticLock(circuit, body.expectedUpdatedAt)

  const confirmedAt = body.clientConfirmedAt ? new Date(body.clientConfirmedAt) : new Date()

  const updated = await prisma.circuit.update({
    where: { id: circuitId },
    data: {
      denatsuRs: body.rs !== undefined ? (body.rs === null ? null : parseFloat(body.rs)) : circuit.denatsuRs,
      denatsuSt: body.st !== undefined ? (body.st === null ? null : parseFloat(body.st)) : circuit.denatsuSt,
      denatsuRt: body.rt !== undefined ? (body.rt === null ? null : parseFloat(body.rt)) : circuit.denatsuRt,
      kensou: body.kensou !== undefined ? body.kensou : circuit.kensou,
      p3Remarks: body.remarks !== undefined ? body.remarks : circuit.p3Remarks,
      p3Worker: workerName,
      p3ConfirmedAt: confirmedAt,
    },
  })

  // ログ詳細テキスト
  const logDetails: string[] = []

  if (body.rs !== undefined) logDetails.push(`RS:${body.rs}V`)
  if (body.st !== undefined) logDetails.push(`ST:${body.st}V`)
  if (body.rt !== undefined) logDetails.push(`RT:${body.rt}V`)
  if (body.kensou) logDetails.push(`検相:${body.kensou}`)
  if (body.remarks) logDetails.push(`備考:${body.remarks}`)

  if (body.isOfflineSync) {
    const syncTimeStr = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })

    logDetails.push(`[同期: ${syncTimeStr}]`)
  }

  await prisma.operationLog.create({
    data: {
      siteId,
      worker: workerName,
      timestamp: confirmedAt,
      action: body.isOfflineSync ? 'フェーズ3 確定 (オフライン同期)' : 'フェーズ3 確定',
      targetBan: circuit.banMeisho,
      targetKairo: circuit.kairoBangou || circuit.kairoMeisho || '',
      details: logDetails.join(' | ') || '送電・電圧測定完了',
    },
  })

  return {
    success: true,
    circuit: updated,
  }
})
