/**
 * 送電試験フェーズ完了判定ロジック
 *
 * Phase 1〜3 の試験完了判定条件および Prisma Where 句の共通ロジックを定義します。
 */

import type { Circuit } from '@prisma/client'

/**
 * 送電試験回路判定用インターフェース
 * Prismaクライアントのキャッシュ状態に依存せず安全に型判定できるよう補強
 */
export type ExamCircuitRow = Partial<Circuit> & {
  p1Kakunin?: boolean | null
  p1Mashishime?: boolean | null
  p1ConfirmedAt?: Date | string | null
  p2IsComplete?: boolean | null
  p2ConfirmedAt?: Date | string | null
  p3IsComplete?: boolean | null
  p3ConfirmedAt?: Date | string | null
}

/**
 * 送電試験（Phase 1〜3）の完了判定ロジック
 */
export const EXAM_LOGIC = {
  PHASE1: {
    isComplete: (row: ExamCircuitRow): boolean => {
      return Boolean(row.p1ConfirmedAt && row.p1Kakunin && row.p1Mashishime)
    },
    prismaWhere: {
      p1ConfirmedAt: { not: null },
      p1Kakunin: true,
      p1Mashishime: true,
    },
  },
  PHASE2: {
    isComplete: (row: ExamCircuitRow): boolean => {
      return Boolean(row.p2ConfirmedAt && row.p2IsComplete)
    },
    prismaWhere: {
      p2ConfirmedAt: { not: null },
      p2IsComplete: true,
    },
  },
  PHASE3: {
    isComplete: (row: ExamCircuitRow): boolean => {
      return Boolean(row.p3ConfirmedAt && row.p3IsComplete)
    },
    prismaWhere: {
      p3ConfirmedAt: { not: null },
      p3IsComplete: true,
    },
  },
} as const
