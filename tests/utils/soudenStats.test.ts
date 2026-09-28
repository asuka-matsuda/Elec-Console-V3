import { describe, expect, it } from 'vitest'

import type { CircuitItem } from '../../shared/types/circuit'
import { calculateSoudenStats } from '../../shared/utils/soudenExam'

describe('calculateSoudenStats (Local-First SSOT)', () => {
  it('returns zero stats when circuits array is empty', () => {
    const stats = calculateSoudenStats([])

    expect(stats.totalCircuits).toBe(0)
    expect(stats.totalActive).toBe(0)
    expect(stats.totalPct).toBe(0)
    expect(stats.trunkTotal).toBe(0)
    expect(stats.secTotal).toBe(0)
  })

  it('correctly aggregates trunk and secondary circuit progress', () => {
    const mockCircuits: CircuitItem[] = [
      // 幹線1: Phase 1〜3 すべて完了
      {
        id: 'c1',
        siteId: 'site-1',
        banMeisho: '1F-1',
        kairoMeisho: '幹線電灯',
        keiTo: '幹線',
        p1Kakunin: true,
        p1Mashishime: true,
        p1ConfirmedAt: '2026-09-28T00:00:00Z',
        p2IsComplete: true,
        p2ConfirmedAt: '2026-09-28T00:00:00Z',
        p3IsComplete: true,
        p3ConfirmedAt: '2026-09-28T00:00:00Z',
        isExcluded: false,
      } as CircuitItem,
      // 幹線2: Phase 1のみ完了
      {
        id: 'c2',
        siteId: 'site-1',
        banMeisho: '1F-1',
        kairoMeisho: '幹線動力',
        keiTo: '幹線',
        p1Kakunin: true,
        p1Mashishime: true,
        p1ConfirmedAt: '2026-09-28T00:00:00Z',
        p2IsComplete: false,
        p3IsComplete: false,
        isExcluded: false,
      } as CircuitItem,
      // 二次側1: Phase 2のみ完了
      {
        id: 'c3',
        siteId: 'site-1',
        banMeisho: '1F-1',
        kairoMeisho: 'L-1',
        keiTo: '二次側',
        p1Kakunin: false,
        p2IsComplete: true,
        p2ConfirmedAt: '2026-09-28T00:00:00Z',
        p3IsComplete: false,
        isExcluded: false,
      } as CircuitItem,
      // 二次側2: 除外対象
      {
        id: 'c4',
        siteId: 'site-1',
        banMeisho: '1F-1',
        kairoMeisho: '予備',
        keiTo: '二次側',
        isExcluded: true,
      } as CircuitItem,
    ]

    const stats = calculateSoudenStats(mockCircuits)

    expect(stats.totalCircuits).toBe(4)
    expect(stats.totalActive).toBe(3)
    expect(stats.totalExcluded).toBe(1)

    // 幹線: 2回路 (除外0)
    expect(stats.trunkTotal).toBe(2)
    expect(stats.trunkExcluded).toBe(0)
    expect(stats.trunkP1).toBe(2)
    expect(stats.trunkP2).toBe(1)
    expect(stats.trunkP3).toBe(1)
    expect(stats.trunkP1Pct).toBe(100)
    expect(stats.trunkP2Pct).toBe(50)
    expect(stats.trunkP3Pct).toBe(50)

    // 二次側: 1回路 (除外1)
    expect(stats.secTotal).toBe(1)
    expect(stats.secExcluded).toBe(1)
    expect(stats.secP1).toBe(0)
    expect(stats.secP2).toBe(1)
    expect(stats.secP3).toBe(0)

    // 全体進捗: (幹線完了数 4 + 二次側完了数 1) / (アクティブ3 * 3 = 9) = 5 / 9 = 56%
    expect(stats.totalPct).toBe(56)
  })
})
