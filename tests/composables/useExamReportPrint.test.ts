import { describe, expect, it, vi } from 'vitest'

import type { CircuitItem } from '#shared/types/circuit'

import { useExamReportPrint } from '../../app/composables/portal/useExamReportPrint'

vi.mock('../../app/composables/useApi', () => ({
  useApi: () => ({
    $api: vi.fn(),
  }),
}))

describe('useExamReportPrint', () => {
  const sampleCircuits: Partial<CircuitItem>[] = [
    { id: 'c-1', banMeisho: '1F電灯盤', kairoMeisho: '事務室' },
    { id: 'c-2', banMeisho: '1F電灯盤', kairoMeisho: '廊下' },
    { id: 'c-3', banMeisho: '2F電灯盤', kairoMeisho: '会議室' },
  ]

  it('aggregates ban list and circuit counts correctly', () => {
    const {
      circuits,
      banList,
      banCircuitCountMap,
      banOptions,
    } = useExamReportPrint('site-1')

    circuits.value = sampleCircuits as CircuitItem[]

    expect(banList.value).toEqual(['1F電灯盤', '2F電灯盤'])
    expect(banCircuitCountMap.value.get('1F電灯盤')).toBe(2)
    expect(banCircuitCountMap.value.get('2F電灯盤')).toBe(1)

    // banOptions has 'ALL' + 2 bans
    expect(banOptions.value).toHaveLength(3)
    expect(banOptions.value[0].value).toBe('ALL')
    expect(banOptions.value[0].label).toContain('2盤 / 3回路')
    expect(banOptions.value[1].value).toBe('1F電灯盤')
    expect(banOptions.value[1].label).toContain('2回路')
  })
})
