import { describe, expect, it, vi } from 'vitest'

import type { CircuitItem } from '#shared/types/circuit'

import { useSoudenDashboard } from '../../app/composables/portal/useSoudenDashboard'

vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $api: vi.fn(),
  }),
}))

vi.mock('../../app/utils/db', () => ({
  CircuitsRepository: {
    getBySite: vi.fn(),
    putAll: vi.fn(),
  },
}))

describe('useSoudenDashboard - フロアフィルター', () => {
  const dummyCircuits: CircuitItem[] = [
    {
      id: 'c1',
      siteId: 'site-1',
      floor: '1F',
      keiTo: '幹線',
      banShubetsu: '電灯',
      banMeisho: '1L-1',
      p1Kakunin: true,
      p1Mashishime: true,
      p1MashishimeCubicle: true,
      p1ConfirmedAt: '2026-09-01T00:00:00Z',
      p2IsComplete: true,
      p2ConfirmedAt: '2026-09-01T00:00:00Z',
      p3IsComplete: true,
      p3ConfirmedAt: '2026-09-01T00:00:00Z',
    },
    {
      id: 'c2',
      siteId: 'site-1',
      floor: '2F',
      keiTo: '二次側',
      banShubetsu: '電灯',
      banMeisho: '2L-1',
      p1Kakunin: false,
      p1Mashishime: false,
      p2IsComplete: false,
    },
    {
      id: 'c3',
      siteId: 'site-1',
      floor: null,
      keiTo: '二次側',
      banShubetsu: '電灯',
      banMeisho: 'XL-1',
      p1Kakunin: false,
      p1Mashishime: false,
      p2IsComplete: false,
    },
    {
      id: 'c4',
      siteId: 'site-1',
      floor: '10F',
      keiTo: '幹線',
      banShubetsu: '動力',
      banMeisho: '10P-1',
      p1Kakunin: false,
      p1Mashishime: false,
      p2IsComplete: false,
    },
  ]

  it('フロア一覧が正しく抽出され、自然順ソートされること', () => {
    const dashboard = useSoudenDashboard('site-1')

    dashboard.allCircuits.value = dummyCircuits

    const options = dashboard.floorOptions.value

    expect(options).toEqual([
      { label: 'すべてのエリア', value: 'ALL' },
      { label: '1F', value: '1F' },
      { label: '2F', value: '2F' },
      { label: '10F', value: '10F' },
      { label: 'エリア未設定', value: '__UNSET__' },
    ])
  })

  it('初期状態（ALL）では全回路が集計対象となること', () => {
    const dashboard = useSoudenDashboard('site-1')

    dashboard.allCircuits.value = dummyCircuits

    expect(dashboard.selectedFloor.value).toBe('ALL')
    expect(dashboard.filteredCircuits.value).toHaveLength(4)
    expect(dashboard.stats.value?.totalCircuits).toBe(4)
    // c1 のみが全フェーズ完了 (1 / 4 = 25%)
    expect(dashboard.stats.value?.p1Total).toBe(1)
  })

  it('特定フロア（1F）を選択したとき、そのフロアの回路のみ集計されること', () => {
    const dashboard = useSoudenDashboard('site-1')

    dashboard.allCircuits.value = dummyCircuits
    dashboard.selectedFloor.value = '1F'

    expect(dashboard.filteredCircuits.value).toHaveLength(1)
    expect(dashboard.stats.value?.totalCircuits).toBe(1)
    expect(dashboard.stats.value?.totalPct).toBe(100)
    expect(dashboard.stats.value?.trunkTotal).toBe(1)
    expect(dashboard.stats.value?.secTotal).toBe(0)
  })

  it('フロア未設定（__UNSET__）を選択したとき、floor が空の回路が集計されること', () => {
    const dashboard = useSoudenDashboard('site-1')

    dashboard.allCircuits.value = dummyCircuits
    dashboard.selectedFloor.value = '__UNSET__'

    expect(dashboard.filteredCircuits.value).toHaveLength(1)
    expect(dashboard.filteredCircuits.value[0]?.id).toBe('c3')
    expect(dashboard.stats.value?.totalCircuits).toBe(1)
    expect(dashboard.stats.value?.totalPct).toBe(0)
  })

  it('選択中のフロアが回路リスト更新で消失した場合、自動で ALL にリセットされること', async () => {
    const dashboard = useSoudenDashboard('site-1')

    dashboard.allCircuits.value = dummyCircuits
    dashboard.selectedFloor.value = '1F'

    // 1F を含まないリストに更新
    dashboard.allCircuits.value = dummyCircuits.filter(c => c.floor !== '1F')

    // watch の実行完了を待機
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(dashboard.selectedFloor.value).toBe('ALL')
  })
})
