/**
 * progress.ts
 * 進捗率（直線バー・円形ゲージ等）の計算・正規化ロジック純粋関数
 */

/**
 * 進捗率を 0〜100 の整数（有限数）に正規化
 */
export const clampProgress = (val: unknown): number => {
  const num = typeof val === 'number' ? val : Number(val)

  if (!Number.isFinite(num)) return 0

  return Math.min(100, Math.max(0, Math.round(num)))
}

/**
 * 円形ゲージ用の幾何パラメータ（円周・オフセット・正規化値）を算出
 */
export const calcCircleProgress = (val: unknown, radius = 42) => {
  const value = clampProgress(val)
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - value / 100)

  return {
    value,
    circumference,
    strokeDashoffset,
  }
}
