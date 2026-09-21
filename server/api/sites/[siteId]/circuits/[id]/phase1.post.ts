/**
 * フェーズ1（受電前自主検査）測定値確定 API
 * POST /api/sites/:siteId/circuits/:id/phase1
 *
 * @description 指定回路のフェーズ1試験結果（絶縁抵抗・接地抵抗・外観検査・施工者）を楽観ロック検証の上で確定登録します。
 * @permission 現場アクセス権限
 */

import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'

import { requireSiteAccess } from '../../../../../utils/auth'
import { atomicUpdateCircuit } from '../../../../../utils/optimisticLock'
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

  const confirmedAt = body.clientConfirmedAt ? new Date(body.clientConfirmedAt) : new Date()

  const updateData: Record<string, unknown> = {
    p1Kakunin: body.kakunin ?? true,
    p1Mashishime: body.mashishime ?? true,
    p1Worker: workerName,
    p1ConfirmedAt: confirmedAt,
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

  const updated = await atomicUpdateCircuit({
    circuitId,
    siteId,
    expectedVersion: typeof body.expectedVersion === 'number' ? body.expectedVersion : undefined,
    expectedUpdatedAt: body.expectedUpdatedAt,
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

  if (body.isOfflineSync) {
    const syncTimeStr = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })

    detailsParts.push(`[同期: ${syncTimeStr}]`)
  }

  await prisma.operationLog.create({
    data: {
      siteId,
      worker: workerName,
      timestamp: confirmedAt,
      action: body.isOfflineSync ? 'フェーズ1 確定 (オフライン同期)' : 'フェーズ1 確定',
      targetBan: updated.banMeisho,
      targetKairo: updated.kairoBangou || updated.kairoMeisho || '',
      details: detailsParts.join(' | ') || '接続確認・増締完了',
    },
  })

  return {
    success: true,
    circuit: updated,
  }
})
