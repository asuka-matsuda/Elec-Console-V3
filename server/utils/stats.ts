/**
 * 送電進捗統計集計ユーティリティ
 *
 * 回路名称と現場の除外キーワード配列から、当該回路が試験対象外（除外回路）か判定します。
 */

/**
 * 回路名称と現場の除外キーワード配列から、当該回路が試験対象外（除外回路）か判定する
 */
export function isCircuitExcluded(
  kairoMeisho: string | null | undefined,
  excludedKeywords: string[],
): boolean {
  const name = (kairoMeisho || '').trim()

  return !name || excludedKeywords.some(kw => Boolean(kw && name.includes(kw)))
}
