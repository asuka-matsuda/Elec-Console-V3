import { describe, expect, it, vi } from 'vitest'

import type { CircuitItem } from '#shared/types/circuit'

import { useExamReportPrint } from '../../app/composables/portal/useExamReportPrint'

const mockApi = vi.fn()

vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $api: mockApi,
  }),
}))

describe('useExamReportPrint', () => {
  const sampleCircuits: Partial<CircuitItem>[] = [
    { id: 'c-1', banMeisho: '1F電灯盤', kairoMeisho: '事務室' },
    { id: 'c-2', banMeisho: '1F電灯盤', kairoMeisho: '廊下' },
    { id: 'c-3', banMeisho: '2F電灯盤', kairoMeisho: '会議室' },
  ]

  it('fetches circuits from API and updates state', async () => {
    mockApi.mockResolvedValueOnce({ circuits: sampleCircuits })

    const { circuits, fetchCircuits } = useExamReportPrint('site-1')

    await fetchCircuits()

    expect(mockApi).toHaveBeenCalledWith('/api/sites/site-1/circuits')
    expect(circuits.value).toHaveLength(3)
    expect(circuits.value[0]?.banMeisho).toBe('1F電灯盤')
  })
})
