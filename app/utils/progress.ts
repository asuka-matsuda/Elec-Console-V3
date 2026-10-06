/**
 * 進捗率・幾何パラメータ計算ユーティリティ
 *
 * 直線バー・円形ゲージ等で使用される進捗率の正規化（0〜100）および幾何オフセットを算出します。
 */

/**
 * 進捗率を 0〜100 の整数（有限数）に正規化
 */
export const clampProgress = (val: unknown, min = 0, max = 100): number => {
  const num = typeof val === 'number' ? val : Number(val)

  if (!Number.isFinite(num)) return 0

  if (min === 0 && max === 100) {
    return Math.min(100, Math.max(0, Math.round(num)))
  }

  const range = max - min

  if (range <= 0) return 0

  const pct = ((num - min) / range) * 100

  return Math.min(100, Math.max(0, Math.round(pct)))
}

/**
 * 円形ゲージ用の幾何パラメータ（円周・オフセット・正規化値）を算出
 */
export const calcCircleProgress = (val: unknown, radius = 42, min = 0, max = 100) => {
  const value = clampProgress(val, min, max)
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - value / 100)

  return {
    value,
    circumference,
    strokeDashoffset,
  }
}
