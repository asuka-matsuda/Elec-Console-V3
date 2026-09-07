import type { Circuit } from '@prisma/client'
import { createError } from 'h3'

/**
 * クライアントの所持する更新日時 (expectedUpdatedAt) と DB 上の最新更新日時 (circuit.updatedAt) を照合し、
 * 競合があれば 409 Conflict を送出する楽観的排他制御ヘルパー。
 */
export function checkOptimisticLock(
  circuit: Circuit,
  expectedUpdatedAt?: string | null,
): void {
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
