import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import type { CircuitItem } from '#shared/types/circuit'

import { usePhasePageSync } from '../../app/composables/portal/phase/usePhasePageSync'

// Mock useRoute
const mockRoute = {
  params: { siteId: 'site-1' },
  query: {
    kei_to: '幹線',
    ban: '1L-1',
    targetCircuit: 'circuit-target-1',
  },
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}))

describe('usePhasePageSync', () => {
  it('initializes and synchronizes query params', async () => {
    const selectedKeiTo = ref('幹線')
    const selectedBanMeisho = ref('ALL')
    const filteredCircuits = ref<CircuitItem[]>([
      { id: 'circuit-target-1', banMeisho: '1L-1', kairoBangou: '1' } as CircuitItem,
    ])
    const fetchCircuits = vi.fn()

    const { targetCircuitId, handleSelectCircuit } = usePhasePageSync({
      siteId: 'site-1',
      selectedKeiTo,
      selectedBanMeisho,
      filteredCircuits,
      fetchCircuits,
    })

    expect(targetCircuitId.value).toBe('circuit-target-1')
    expect(selectedBanMeisho.value).toBe('1L-1')
    expect(typeof handleSelectCircuit).toBe('function')
  })
})
