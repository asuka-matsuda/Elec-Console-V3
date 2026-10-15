/**
 * フェーズ3（送電・電圧測定・検相）測定値確定 API
 * POST /api/sites/:siteId/circuits/:id/phase3
 *
 * @description 指定回路のフェーズ3試験結果（各相線間電圧・検相・送電日時）を確定登録します。
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

function parseVoltageValue(val: unknown, fieldName: string): number | null | undefined {
  if (val === undefined) return undefined
  if (val === null || val === '') return null
  const num = typeof val === 'number' ? val : Number(val)

  if (!Number.isFinite(num) || num < 0) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: `${fieldName}の電圧測定値が不正です。0以上の数値を指定してください。`,
    })
  }

  return num
}

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

  const rsVal = !isRemarksOnly ? parseVoltageValue(body.rs, 'RS間') : undefined
  const stVal = !isRemarksOnly ? parseVoltageValue(body.st, 'ST間') : undefined
  const rtVal = !isRemarksOnly ? parseVoltageValue(body.rt, 'RT間') : undefined

  const updated = await prisma.$transaction(async (tx) => {
    const updateData: Record<string, unknown> = isRemarksOnly
      ? {
          p3Remarks: body.remarks !== undefined ? body.remarks : null,
        }
      : {
          denatsuRs: rsVal,
          denatsuSt: stVal,
          denatsuRt: rtVal,
          kensou: body.kensou !== undefined ? body.kensou : undefined,
          p3Remarks: body.remarks !== undefined ? body.remarks : undefined,
          p3Worker: workerName,
          p3ConfirmedAt: confirmedAt,
          p3IsComplete: body.isComplete !== undefined
            ? Boolean(body.isComplete)
            : (body.kensou === '正' || body.kensou === '良'),
        }

    const updatedCircuit = await atomicUpdateCircuit({
      circuitId,
      siteId,
      expectedVersion: typeof body.expectedVersion === 'number' ? body.expectedVersion : undefined,
      expectedUpdatedAt: body.expectedUpdatedAt,
      data: updateData,
      tx,
    })

    // ログ詳細テキスト
    const logDetails: string[] = []

    if (!isRemarksOnly) {
      if (rsVal !== undefined && rsVal !== null) logDetails.push(`RS:${rsVal}V`)
      if (stVal !== undefined && stVal !== null) logDetails.push(`ST:${stVal}V`)
      if (rtVal !== undefined && rtVal !== null) logDetails.push(`RT:${rtVal}V`)
      if (body.kensou) logDetails.push(`検相:${body.kensou}`)
    }
    if (body.remarks) logDetails.push(`備考:${body.remarks}`)

    if (body.isOfflineSync) {
      const syncTimeStr = formatSyncTimeString()

      logDetails.push(`[同期: ${syncTimeStr}]`)
    }

    const baseAction = isRemarksOnly ? 'フェーズ3 備考保存' : 'フェーズ3 確定'

    await tx.operationLog.create({
      data: {
        siteId,
        worker: workerName,
        timestamp: confirmedAt,
        action: body.isOfflineSync ? `${baseAction} (オフライン同期)` : baseAction,
        targetBan: updatedCircuit.banMeisho,
        targetKairo: updatedCircuit.kairoBangou || updatedCircuit.kairoMeisho || '',
        details: logDetails.join(' | ') || (isRemarksOnly ? '備考を保存しました' : '送電・電圧測定完了'),
      },
    })

    return updatedCircuit
  })

  return {
    success: true,
    circuit: updated,
  }
})
