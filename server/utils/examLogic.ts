/**
 * 送電試験フェーズ完了判定ロジック
 *
 * Phase 1〜3 の試験完了判定条件および Prisma Where 句の共通ロジックを定義します。
 */

import {
  isPhase1Complete,
  isPhase2Complete,
  isPhase3Complete,
} from '#shared/utils/soudenExam'

/**
 * 送電試験（Phase 1〜3）の完了判定ロジック
 */
export const EXAM_LOGIC = {
  PHASE1: {
    isComplete: isPhase1Complete,
    prismaWhere: {
      p1ConfirmedAt: { not: null },
      p1Kakunin: true,
      p1Mashishime: true,
    },
  },
  PHASE2: {
    isComplete: isPhase2Complete,
    prismaWhere: {
      p2ConfirmedAt: { not: null },
      p2IsComplete: true,
    },
  },
  PHASE3: {
    isComplete: isPhase3Complete,
    prismaWhere: {
      p3ConfirmedAt: { not: null },
      p3IsComplete: true,
    },
  },
} as const
