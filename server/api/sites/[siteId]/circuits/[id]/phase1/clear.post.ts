/**
 * フェーズ1測定値解除 API
 * POST /api/sites/:siteId/circuits/:id/phase1/clear
 *
 * @description 指定回路のフェーズ1確定結果を安全にリセット・解除します。
 * @permission 現場アクセス権限
 */

import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'

import { requireSiteAccess } from '../../../../../../utils/auth'
import { atomicUpdateCircuit } from '../../../../../../utils/optimisticLock'
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

  const updated = await atomicUpdateCircuit({
    circuitId,
    siteId,
    expectedVersion: typeof body?.expectedVersion === 'number' ? body.expectedVersion : undefined,
    expectedUpdatedAt: body?.expectedUpdatedAt,
    data: {
      p1Kakunin: false,
      p1Mashishime: false,
      p1Worker: null,
      p1ConfirmedAt: null,
    },
  })

  const clearedAt = body?.clientConfirmedAt ? new Date(body.clientConfirmedAt) : new Date()

  await prisma.operationLog.create({
    data: {
      siteId,
      worker: workerName,
      timestamp: clearedAt,
      action: body?.isOfflineSync ? 'フェーズ1 確定解除 (オフライン同期)' : 'フェーズ1 確定解除',
      targetBan: updated.banMeisho,
      targetKairo: updated.kairoBangou || updated.kairoMeisho || '',
      details: body?.isOfflineSync
        ? `確定状態を解除しました [同期: ${new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}]`
        : '確定状態を解除しました',
    },
  })

  return {
    success: true,
    circuit: updated,
  }
})
