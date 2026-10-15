/**
 * フェーズ2（耐電圧試験・高圧受電）測定値確定 API
 * POST /api/sites/:siteId/circuits/:id/phase2
 *
 * @description 指定回路のフェーズ2試験結果（耐圧測定・合否判定・試験員）を確定登録します。
 * @permission 現場アクセス権限
 */

import { defineEventHandler, getRouterParam, readBody } from 'h3'

import { ErrorCode } from '#shared/types/errors'
import { getPhase2ActivePhases, isPhase2MeasurementsPass } from '#shared/utils/soudenExam'
import { getUserDisplayName } from '#shared/utils/user'

import { requireSiteRole } from '../../../../../utils/auth'
import { formatSyncTimeString, parseValidDate } from '../../../../../utils/date'
import { createAppError } from '../../../../../utils/error'
import { atomicUpdateCircuit } from '../../../../../utils/optimisticLock'
import { prisma } from '../../../../../utils/prisma'

function parseMeasurementValue(val: unknown, fieldName: string): number | null | undefined {
  if (val === undefined) return undefined
  if (val === null || val === '') return null
  const num = typeof val === 'number' ? val : Number(val)

  if (!Number.isFinite(num) || num < 0) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: `${fieldName}の測定値が不正です。0以上の数値を指定してください。`,
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

  const rVal = !isRemarksOnly ? parseMeasurementValue(body.rVal, 'R相') : undefined
  const sVal = !isRemarksOnly ? parseMeasurementValue(body.sVal, 'S/N相') : undefined
  const tVal = !isRemarksOnly ? parseMeasurementValue(body.tVal, 'T相') : undefined

  const updated = await prisma.$transaction(async (tx) => {
    let updateData: Record<string, unknown>

    if (isRemarksOnly) {
      updateData = {
        p2Remarks: body.remarks !== undefined ? body.remarks : null,
      }
    }
    else {
      let isComplete = body.isComplete !== undefined ? Boolean(body.isComplete) : undefined

      if (isComplete === undefined) {
        const existing = await tx.circuit.findFirst({
          where: { id: circuitId, siteId },
          select: { souShubetsu: true, haidenHoushiki: true },
        })
        const active = getPhase2ActivePhases(existing?.souShubetsu, existing?.haidenHoushiki)

        isComplete = isPhase2MeasurementsPass(active, body.rStatus, body.sStatus, body.tStatus)
      }

      updateData = {
        zetsuenR: rVal,
        zetsuenS: sVal,
        zetsuenT: tVal,
        p2RStatus: body.rStatus !== undefined ? body.rStatus : undefined,
        p2SStatus: body.sStatus !== undefined ? body.sStatus : undefined,
        p2TStatus: body.tStatus !== undefined ? body.tStatus : undefined,
        p2Remarks: body.remarks !== undefined ? body.remarks : undefined,
        p2Worker: workerName,
        p2IsComplete: isComplete,
        p2ConfirmedAt: confirmedAt,
      }
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
      if (body.rStatus) logDetails.push(`R:${body.rStatus}${rVal !== null && rVal !== undefined ? `(${rVal}MΩ)` : ''}`)
      if (body.sStatus) logDetails.push(`S/N:${body.sStatus}${sVal !== null && sVal !== undefined ? `(${sVal}MΩ)` : ''}`)
      if (body.tStatus) logDetails.push(`T:${body.tStatus}${tVal !== null && tVal !== undefined ? `(${tVal}MΩ)` : ''}`)
    }
    if (body.remarks) logDetails.push(`備考:${body.remarks}`)

    if (body.isOfflineSync) {
      const syncTimeStr = formatSyncTimeString()

      logDetails.push(`[同期: ${syncTimeStr}]`)
    }

    const baseAction = isRemarksOnly ? 'フェーズ2 備考保存' : 'フェーズ2 確定'

    await tx.operationLog.create({
      data: {
        siteId,
        worker: workerName,
        timestamp: confirmedAt,
        action: body.isOfflineSync ? `${baseAction} (オフライン同期)` : baseAction,
        targetBan: updatedCircuit.banMeisho,
        targetKairo: updatedCircuit.kairoBangou || updatedCircuit.kairoMeisho || '',
        details: logDetails.join(' | ') || (isRemarksOnly ? '備考を保存しました' : '絶縁抵抗測定完了'),
      },
    })

    return updatedCircuit
  })

  return {
    success: true,
    circuit: updated,
  }
})
