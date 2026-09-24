/**
 * フェーズ2（耐電圧試験・高圧受電）測定値確定 API
 * POST /api/sites/:siteId/circuits/:id/phase2
 *
 * @description 指定回路のフェーズ2試験結果（耐圧測定・合否判定・試験員）を確定登録します。
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
      zetsuenR: body.rVal !== undefined ? (body.rVal === null ? null : parseFloat(body.rVal)) : undefined,
      zetsuenS: body.sVal !== undefined ? (body.sVal === null ? null : parseFloat(body.sVal)) : undefined,
      zetsuenT: body.tVal !== undefined ? (body.tVal === null ? null : parseFloat(body.tVal)) : undefined,
      p2RStatus: body.rStatus !== undefined ? body.rStatus : undefined,
      p2SStatus: body.sStatus !== undefined ? body.sStatus : undefined,
      p2TStatus: body.tStatus !== undefined ? body.tStatus : undefined,
      p2Remarks: body.remarks !== undefined ? body.remarks : undefined,
      p2Worker: workerName,
      p2IsComplete: body.isComplete !== undefined
        ? Boolean(body.isComplete)
        : (body.rStatus === 'OK' && body.sStatus === 'OK' && body.tStatus === 'OK'),
      p2ConfirmedAt: confirmedAt,
    },
  })

  // ログ詳細テキスト
  const logDetails: string[] = []

  if (body.rStatus) logDetails.push(`R:${body.rStatus}${body.rVal ? `(${body.rVal}MΩ)` : ''}`)
  if (body.sStatus) logDetails.push(`S/N:${body.sStatus}${body.sVal ? `(${body.sVal}MΩ)` : ''}`)
  if (body.tStatus) logDetails.push(`T:${body.tStatus}${body.tVal ? `(${body.tVal}MΩ)` : ''}`)
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
      action: body.isOfflineSync ? 'フェーズ2 確定 (オフライン同期)' : 'フェーズ2 確定',
      targetBan: updated.banMeisho,
      targetKairo: updated.kairoBangou || updated.kairoMeisho || '',
      details: logDetails.join(' | ') || '絶縁抵抗測定完了',
    },
  })

  return {
    success: true,
    circuit: updated,
  }
})
