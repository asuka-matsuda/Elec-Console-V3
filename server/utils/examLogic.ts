/**
 * 送電試験フェーズ完了判定・解除共通ロジック
 *
 * Phase 1〜3 の試験完了判定条件および測定値解除の共通ハンドラを定義します。
 */

import type { H3Event } from 'h3'
import { getRouterParam, readBody } from 'h3'
import { z } from 'zod'

import { ErrorCode } from '#shared/types/errors'
import {
  isPhase1Complete,
  isPhase2Complete,
  isPhase3Complete,
} from '#shared/utils/soudenExam'
import { getUserDisplayName } from '#shared/utils/user'

import { requireSiteRole } from './auth'
import { formatSyncTimeString, parseValidDate } from './date'
import { createAppError } from './error'
import { atomicUpdateCircuit } from './optimisticLock'
import { prisma } from './prisma'

/**
 * 送電試験（Phase 1〜3）の完了判定ロジック
 */
export const EXAM_LOGIC = {
  PHASE1: {
    isComplete: isPhase1Complete,
  },
  PHASE2: {
    isComplete: isPhase2Complete,
  },
  PHASE3: {
    isComplete: isPhase3Complete,
  },
} as const

const CLEAR_PHASE_DATA: Record<1 | 2 | 3, Record<string, unknown>> = {
  1: {
    p1Kakunin: false,
    p1Mashishime: false,
    p1MashishimeCubicle: false,
    p1Worker: null,
    p1ConfirmedAt: null,
  },
  2: {
    zetsuenR: null,
    zetsuenS: null,
    zetsuenT: null,
    p2RStatus: null,
    p2SStatus: null,
    p2TStatus: null,
    p2Worker: null,
    p2ConfirmedAt: null,
    p2IsComplete: false,
  },
  3: {
    denatsuRs: null,
    denatsuSt: null,
    denatsuRt: null,
    kensou: null,
    p3Worker: null,
    p3ConfirmedAt: null,
    p3IsComplete: false,
  },
}

const ClearPhaseBodySchema = z.object({
  expectedVersion: z.number().int().optional().nullable(),
  expectedUpdatedAt: z.string().optional().nullable(),
  isOfflineSync: z.boolean().optional(),
  clientConfirmedAt: z.string().optional().nullable(),
}).passthrough()

/**
 * 指定回路のフェーズ確定結果を安全にリセット・解除する共通ハンドラ
 */
export async function clearCircuitPhase(event: H3Event, phase: 1 | 2 | 3) {
  const user = await requireSiteRole(event, ['admin', 'worker'])
  const siteId = getRouterParam(event, 'siteId')
  const circuitId = getRouterParam(event, 'id')

  if (!siteId || !circuitId) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: 'パラメータが不足しています',
    })
  }

  const rawBody = await readBody(event).catch(() => ({}))
  const parsedBody = ClearPhaseBodySchema.safeParse(rawBody && typeof rawBody === 'object' ? rawBody : {})

  if (!parsedBody.success) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: 'リクエストパラメータの形式が不正です。',
    })
  }

  const body = parsedBody.data
  const workerName = getUserDisplayName(user)
  const clearedAt = parseValidDate(body.clientConfirmedAt) || new Date()
  const baseAction = phase === 1 ? 'フェーズ1 確定解除' : `フェーズ${phase} 解除`
  const baseDetails = phase === 1 ? '確定状態を解除しました' : `フェーズ${phase}の確定状態を解除しました`

  const updated = await prisma.$transaction(async (tx) => {
    const circuit = await atomicUpdateCircuit({
      circuitId,
      siteId,
      expectedVersion: typeof body.expectedVersion === 'number' ? body.expectedVersion : undefined,
      expectedUpdatedAt: body.expectedUpdatedAt,
      data: CLEAR_PHASE_DATA[phase],
      tx,
    })

    await tx.operationLog.create({
      data: {
        siteId,
        worker: workerName,
        timestamp: clearedAt,
        action: body.isOfflineSync ? `${baseAction} (オフライン同期)` : baseAction,
        targetBan: circuit.banMeisho,
        targetKairo: circuit.kairoBangou || circuit.kairoMeisho || '',
        details: body.isOfflineSync
          ? `${baseDetails} [同期: ${formatSyncTimeString()}]`
          : baseDetails,
      },
    })

    return circuit
  })

  return {
    success: true,
    circuit: updated,
  }
}
