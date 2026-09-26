/**
 * 送電試験フェーズ完了判定共通ロジック（Single Source of Truth）
 *
 * クライアント（UI表示・バリデーション）とサーバー（集計・進捗判定）の双方が参照する
 * Phase 1〜3 の試験完了判定純粋関数を提供します。
 */

/**
 * 送電試験の判定対象となる回路オブジェクトの共通インターフェース
 */
export type ExamJudgeableCircuit = {
  p1Kakunin?: boolean | null
  p1Mashishime?: boolean | null
  p1ConfirmedAt?: Date | string | null
  p2IsComplete?: boolean | null
  p2ConfirmedAt?: Date | string | null
  p3IsComplete?: boolean | null
  p3ConfirmedAt?: Date | string | null
  [key: string]: unknown
}

/**
 * フェーズ1（外観・配線確認および端子増締め）が完了しているかを判定
 */
export function isPhase1Complete(c: ExamJudgeableCircuit): boolean {
  return Boolean(c.p1ConfirmedAt && c.p1Kakunin && c.p1Mashishime)
}

/**
 * フェーズ2（耐電圧・絶縁抵抗測定）が完了しているかを判定
 */
export function isPhase2Complete(c: ExamJudgeableCircuit): boolean {
  return Boolean(c.p2ConfirmedAt && c.p2IsComplete)
}

/**
 * フェーズ3（送電・検相・電圧測定）が完了しているかを判定
 */
export function isPhase3Complete(c: ExamJudgeableCircuit): boolean {
  return Boolean(c.p3ConfirmedAt && c.p3IsComplete)
}

/**
 * 指定したフェーズ番号（1〜3）が完了しているかを判定
 */
export function isPhaseComplete(c: ExamJudgeableCircuit, phase: number): boolean {
  if (phase === 1) return isPhase1Complete(c)
  if (phase === 2) return isPhase2Complete(c)
  if (phase === 3) return isPhase3Complete(c)

  return false
}
