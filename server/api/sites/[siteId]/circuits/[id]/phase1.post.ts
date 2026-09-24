/**
 * フェーズ1（回路確認・増締）確定 API
 * POST /api/sites/:siteId/circuits/:id/phase1
 *
 * @description 指定回路のフェーズ1試験結果（回路サイズ確認・増締・備考）を楽観ロック検証の上で確定登録します。
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

  // 既存回路のチェック状態を取得（未指定時の保持）
  const existingCircuit = await prisma.circuit.findUnique({
    where: { id: circuitId },
    select: { p1Kakunin: true, p1Mashishime: true, p1ConfirmedAt: true },
  })

  const finalKakunin = body.kakunin !== undefined ? Boolean(body.kakunin) : (existingCircuit?.p1Kakunin ?? false)
  const finalMashishime = body.mashishime !== undefined ? Boolean(body.mashishime) : (existingCircuit?.p1Mashishime ?? false)
  const hasAnyCheck = finalKakunin || finalMashishime

  const updateData: Record<string, unknown> = {
    p1Kakunin: finalKakunin,
    p1Mashishime: finalMashishime,
    p1Worker: hasAnyCheck ? workerName : null,
    p1ConfirmedAt: hasAnyCheck ? confirmedAt : null,
  }

  if (body.remarks !== undefined) updateData.p1Remarks = body.remarks
  if (body.modifiedFields !== undefined) {
    updateData.p1ModifiedFields = typeof body.modifiedFields === 'string'
      ? body.modifiedFields
      : JSON.stringify(body.modifiedFields)
  }

  // 回路仕様の修正フィールド（互換性担保）
  const CIRCUIT_SPEC_FIELDS = [
    'haidenHoushiki',
    'souShubetsu',
    'shadankiShubetsu',
    'shadankiYouryou',
    'kairoBangou',
    'kairoMeisho',
    'cableList',
    'haisenJousuu',
    'setsuchiList',
  ] as const

  for (const field of CIRCUIT_SPEC_FIELDS) {
    if (body[field] !== undefined) updateData[field] = body[field]
  }

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
