/**
 * 送電進捗統計集計ユーティリティ
 *
 * 現場ごとの除外回路判定を行い、共通ロジック（shared/utils/soudenExam）に委譲して
 * 各フェーズ（Phase 1〜3）の完了率・進捗率（SoudenStats）を集計します。
 */

import type { CircuitItem, SoudenStats } from '#shared/types/circuit'
import { calculateSoudenStats } from '#shared/utils/soudenExam'

import { parseExcludedCircuits } from './jsonFields'
import { prisma } from './prisma'

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

export async function getSoudenStats(siteId: string): Promise<SoudenStats> {
  // 現場設定から除外キーワードを取得
  const settings = await prisma.siteSettings.findUnique({
    where: { siteId },
  })

  const excludedKeywords = parseExcludedCircuits(settings?.excludedCircuits)

  // 現場の全回路を取得
  const circuits = await prisma.circuit.findMany({
    where: { siteId },
    select: {
      id: true,
      keiTo: true,
      kairoMeisho: true,
      p1Kakunin: true,
      p1Mashishime: true,
      p1MashishimeCubicle: true,
      p1ConfirmedAt: true,
      p2IsComplete: true,
      p2ConfirmedAt: true,
      p3ConfirmedAt: true,
      p3IsComplete: true,
    },
  })

  // 各回路の除外状態を判定し、共通計算エンジン（SSOT）へ委譲
  const evaluatedCircuits = circuits.map((c) => {
    return {
      ...c,
      isExcluded: isCircuitExcluded(c.kairoMeisho, excludedKeywords),
    } as unknown as CircuitItem
  })

  return calculateSoudenStats(evaluatedCircuits)
}
