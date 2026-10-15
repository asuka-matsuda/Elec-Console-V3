/**
 * フェーズ1（回路確認・増締）確定 API
 * POST /api/sites/:siteId/circuits/:id/phase1
 *
 * @description 指定回路のフェーズ1試験結果（回路サイズ確認・増締・備考）を楽観ロック検証の上で確定登録します。
 * @permission 現場アクセス権限
 */

import { defineEventHandler, getRouterParam, readBody } from 'h3'

import { ErrorCode } from '#shared/types/errors'
import { getUserDisplayName } from '#shared/utils/user'

import { requireSiteRole } from '../../../../../utils/auth'
import { formatSyncTimeString, parseValidDate } from '../../../../../utils/date'
import { createAppError } from '../../../../../utils/error'
import { atomicUpdateCircuit } from '../../../../../utils/optimisticLock'
import { prisma } from '../../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireSiteRole(event, ['admin', 'worker'])
  const siteId = getRouterParam(event, 'siteId')
  const circuitId = getRouterParam(event, 'id')

  if (!siteId || !circuitId) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: 'パラメータが不足しています',
    })
  }

  const body = (await readBody(event).catch(() => ({}))) || {}
  const workerName = getUserDisplayName(user)

  const confirmedAt = parseValidDate(body.clientConfirmedAt) || new Date()
  const isRemarksOnly = Boolean(body.remarksOnly)

  const updated = await prisma.$transaction(async (tx) => {
    const updateData: Record<string, unknown> = {}

    if (!isRemarksOnly) {
      // 既存回路のチェック状態を取得（未指定時の保持）
      const existingCircuit = await tx.circuit.findFirst({
        where: { id: circuitId, siteId },
        select: { p1Kakunin: true, p1Mashishime: true, p1MashishimeCubicle: true, p1ConfirmedAt: true },
      })

      const finalKakunin = body.kakunin !== undefined ? Boolean(body.kakunin) : (existingCircuit?.p1Kakunin ?? false)
      const finalMashishime = body.mashishime !== undefined ? Boolean(body.mashishime) : (existingCircuit?.p1Mashishime ?? false)
      const finalMashishimeCubicle = body.mashishimeCubicle !== undefined ? Boolean(body.mashishimeCubicle) : (existingCircuit?.p1MashishimeCubicle ?? false)
      const hasAnyCheck = finalKakunin || finalMashishime || finalMashishimeCubicle

      updateData.p1Kakunin = finalKakunin
      updateData.p1Mashishime = finalMashishime
      updateData.p1MashishimeCubicle = finalMashishimeCubicle
      updateData.p1Worker = hasAnyCheck ? workerName : null
      updateData.p1ConfirmedAt = hasAnyCheck ? confirmedAt : null
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

    const updatedCircuit = await atomicUpdateCircuit({
      circuitId,
      siteId,
      expectedVersion: typeof body.expectedVersion === 'number' ? body.expectedVersion : undefined,
      expectedUpdatedAt: body.expectedUpdatedAt,
      data: updateData,
      tx,
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
      const syncTimeStr = formatSyncTimeString()

      detailsParts.push(`[同期: ${syncTimeStr}]`)
    }

    const baseAction = isRemarksOnly ? 'フェーズ1 備考保存' : 'フェーズ1 確定'

    await tx.operationLog.create({
      data: {
        siteId,
        worker: workerName,
        timestamp: confirmedAt,
        action: body.isOfflineSync ? `${baseAction} (オフライン同期)` : baseAction,
        targetBan: updatedCircuit.banMeisho,
        targetKairo: updatedCircuit.kairoBangou || updatedCircuit.kairoMeisho || '',
        details: detailsParts.join(' | ') || (isRemarksOnly ? '備考を保存しました' : '接続確認・増締完了'),
      },
    })

    return updatedCircuit
  })

  return {
    success: true,
    circuit: updated,
  }
})
