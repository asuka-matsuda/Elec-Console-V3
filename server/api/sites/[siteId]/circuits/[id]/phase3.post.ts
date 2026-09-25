/**
 * フェーズ3（送電・電圧測定・検相）測定値確定 API
 * POST /api/sites/:siteId/circuits/:id/phase3
 *
 * @description 指定回路のフェーズ3試験結果（各相線間電圧・検相・送電日時）を確定登録します。
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

  const updated = await atomicUpdateCircuit({
    circuitId,
    siteId,
    expectedVersion: typeof body.expectedVersion === 'number' ? body.expectedVersion : undefined,
    expectedUpdatedAt: body.expectedUpdatedAt,
    data: {
      denatsuRs: body.rs !== undefined ? (body.rs === null ? null : parseFloat(body.rs)) : undefined,
      denatsuSt: body.st !== undefined ? (body.st === null ? null : parseFloat(body.st)) : undefined,
      denatsuRt: body.rt !== undefined ? (body.rt === null ? null : parseFloat(body.rt)) : undefined,
      kensou: body.kensou !== undefined ? body.kensou : undefined,
      p3Remarks: body.remarks !== undefined ? body.remarks : undefined,
      p3Worker: workerName,
      p3ConfirmedAt: confirmedAt,
      p3IsComplete: body.isComplete !== undefined
        ? Boolean(body.isComplete)
        : (body.kensou === '正' || body.kensou === '良'),
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
      targetBan: updated.banMeisho,
      targetKairo: updated.kairoBangou || updated.kairoMeisho || '',
      details: logDetails.join(' | ') || '送電・電圧測定完了',
    },
  })

  return {
    success: true,
    circuit: updated,
  }
})
