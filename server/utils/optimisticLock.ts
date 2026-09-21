import type { Circuit, Prisma } from '@prisma/client'

import { ErrorCode } from '#shared/types/errors'

import { createAppError } from './error'
import { prisma } from './prisma'

/**
 * クライアントの所持する更新バージョン (expectedVersion) または更新日時 (expectedUpdatedAt) と
 * DB 上の最新状態 (circuit) を照合し、競合があれば 409 Conflict を送出する楽観的排他制御ヘルパー。
 */
export function checkOptimisticLock(
  circuit: Circuit,
  expectedUpdatedAt?: string | null,
  expectedVersion?: number | null,
): void {
  // バージョン番号が渡されている場合は厳密な完全一致判定（最優先）
  if (typeof expectedVersion === 'number' && typeof circuit.version === 'number') {
    if (circuit.version !== expectedVersion) {
      throw createAppError({
        code: ErrorCode.CIRCUIT_VERSION_CONFLICT,
        message: '他の作業者（または別端末）によってこの回路のデータが更新されています。最新のデータを反映しました。確認の上、再度実行してください。',
        details: {
          currentCircuit: circuit,
        },
      })
    }

    return
  }

  if (!expectedUpdatedAt || !circuit.updatedAt) {
    return
  }

  const clientTime = new Date(expectedUpdatedAt).getTime()
  const serverTime = new Date(circuit.updatedAt).getTime()

  // タイムスタンプに2秒以上の差分がある場合、別端末による更新とみなす
  if (Math.abs(serverTime - clientTime) > 2000) {
    throw createAppError({
      code: ErrorCode.CIRCUIT_VERSION_CONFLICT,
      message: '他の作業者（または別端末）によってこの回路のデータが更新されています。最新のデータを反映しました。確認の上、再度実行してください。',
      details: {
        currentCircuit: circuit,
      },
    })
  }
}

export interface AtomicUpdateCircuitParams {
  circuitId: string
  siteId: string
  expectedVersion?: number | null
  expectedUpdatedAt?: string | null
  data: Prisma.CircuitUpdateManyMutationInput
}

/**
 * データベースレベルでバージョン番号（または日時）をアトミックに照合・更新するヘルパー。
 * TOCTOU (Time of Check to Time of Use) レースコンディションを完全に排除します。
 */
export async function atomicUpdateCircuit(
  params: AtomicUpdateCircuitParams,
): Promise<Circuit> {
  const { circuitId, siteId, expectedVersion, expectedUpdatedAt, data } = params

  // 1. バージョン番号が渡されている場合は updateMany による 1 クエリ・アトミック更新を実行
  if (typeof expectedVersion === 'number') {
    const result = await prisma.circuit.updateMany({
      where: {
        id: circuitId,
        siteId,
        version: expectedVersion,
      },
      data: {
        ...data,
        version: { increment: 1 },
      },
    })

    if (result.count === 0) {
      // 更新件数が 0 件 = 対象が存在しない、またはバージョン不一致による競合
      const currentCircuit = await prisma.circuit.findFirst({
        where: { id: circuitId, siteId },
      })

      if (!currentCircuit) {
        throw createAppError({
          code: ErrorCode.CIRCUIT_NOT_FOUND,
          message: '指定された回路が見つかりません。',
        })
      }

      throw createAppError({
        code: ErrorCode.CIRCUIT_VERSION_CONFLICT,
        message: '他の作業者（または別端末）によってこの回路のデータが更新されています。最新のデータを反映しました。確認の上、再度実行してください。',
        details: {
          currentCircuit,
        },
      })
    }

    return await prisma.circuit.findUniqueOrThrow({
      where: { id: circuitId },
    })
  }

  // 2. expectedVersion が指定されていない場合は更新日時 (expectedUpdatedAt) による検証と更新
  const circuit = await prisma.circuit.findFirst({
    where: { id: circuitId, siteId },
  })

  if (!circuit) {
    throw createAppError({
      code: ErrorCode.CIRCUIT_NOT_FOUND,
      message: '指定された回路が見つかりません。',
    })
  }

  checkOptimisticLock(circuit, expectedUpdatedAt)

  return await prisma.circuit.update({
    where: { id: circuitId },
    data: {
      ...data,
      version: { increment: 1 },
    },
  })
}
