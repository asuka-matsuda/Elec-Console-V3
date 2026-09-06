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

  const updateData: Record<string, unknown> = {
    p1Kakunin: body.kakunin ?? true,
    p1Mashishime: body.mashishime ?? true,
    p1Worker: workerName,
    p1ConfirmedAt: new Date(),
  }

  if (body.remarks !== undefined) updateData.p1Remarks = body.remarks
  if (body.modifiedFields !== undefined) {
    updateData.p1ModifiedFields = typeof body.modifiedFields === 'string'
      ? body.modifiedFields
      : JSON.stringify(body.modifiedFields)
  }

  // インライン編集されたフィールドの更新
  if (body.haidenHoushiki !== undefined) updateData.haidenHoushiki = body.haidenHoushiki
  if (body.souShubetsu !== undefined) updateData.souShubetsu = body.souShubetsu
  if (body.shadankiShubetsu !== undefined) updateData.shadankiShubetsu = body.shadankiShubetsu
  if (body.shadankiYouryou !== undefined) updateData.shadankiYouryou = body.shadankiYouryou
  if (body.kairoBangou !== undefined) updateData.kairoBangou = body.kairoBangou
  if (body.kairoMeisho !== undefined) updateData.kairoMeisho = body.kairoMeisho
  if (body.cableList !== undefined) updateData.cableList = body.cableList
  if (body.haisenJousuu !== undefined) updateData.haisenJousuu = body.haisenJousuu
  if (body.setsuchiList !== undefined) updateData.setsuchiList = body.setsuchiList

  const updated = await prisma.circuit.update({
    where: { id: circuitId },
    data: updateData,
  })

  // 操作ログの記録
  const detailsParts: string[] = []

  if (Array.isArray(body.modifiedFields) && body.modifiedFields.length > 0) {
    detailsParts.push(`修正: ${body.modifiedFields.join(', ')}`)
  }

  if (body.remarks) {
    detailsParts.push(`備考: ${body.remarks}`)
  }

  await prisma.operationLog.create({
    data: {
      siteId,
      worker: workerName,
      action: 'フェーズ1 確定',
      targetBan: circuit.banMeisho,
      targetKairo: circuit.kairoBangou || circuit.kairoMeisho || '',
      details: detailsParts.join(' | ') || '接続確認・増し締め完了',
    },
  })

  return {
    success: true,
    circuit: updated,
  }
})
