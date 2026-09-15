import type { Circuit, Prisma } from '@prisma/client'
import { createError } from 'h3'

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
      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        message: `他の作業員（または別端末）によってこの回路のデータが更新されています。最新のデータを反映しました。確認の上、再度実行してください。`,
        data: {
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
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: `他の作業員（または別端末）によってこの回路のデータが更新されています。最新のデータを反映しました。確認の上、再度実行してください。`,
      data: {
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
        throw createError({
          statusCode: 404,
          statusMessage: 'Not Found',
          message: '指定された回路が見つかりません',
        })
      }

      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        message: '他の作業員（または別端末）によってこの回路のデータが更新されています。最新のデータを反映しました。確認の上、再度実行してください。',
        data: {
          currentCircuit,
        },
      })
    }

    return await prisma.circuit.findUniqueOrThrow({
      where: { id: circuitId },
    })
  }

  // 2. expectedVersion が指定されていない場合は従来の日時検証と更新（後方互換対応）
  const circuit = await prisma.circuit.findFirst({
    where: { id: circuitId, siteId },
  })

  if (!circuit) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: '指定された回路が見つかりません',
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
