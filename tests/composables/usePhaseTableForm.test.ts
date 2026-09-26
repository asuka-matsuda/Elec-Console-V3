import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import type { CircuitItem } from '#shared/types/circuit'

import { usePhaseTableForm } from '../../../app/composables/portal/phase/usePhaseTableForm'

describe('usePhaseTableForm', () => {
  const sampleCircuits: Partial<CircuitItem>[] = [
    {
      id: 'c-1',
      p1Kakunin: false,
      p1Mashishime: false,
      p1Remarks: 'メモ1',
      p1ConfirmedAt: null,
      isExcluded: false,
    },
    {
      id: 'c-2',
      p1Kakunin: true,
      p1Mashishime: true,
      p1Remarks: '',
      p1ConfirmedAt: '2026-09-01T00:00:00Z',
      isExcluded: false,
    },
    {
      id: 'c-3',
      p1Kakunin: false,
      p1Mashishime: false,
      p1ConfirmedAt: null,
      isExcluded: true,
    },
  ]

  interface TestForm {
    kakunin: boolean
    mashishime: boolean
    remarks: string
  }

  const initForm = (c: CircuitItem): TestForm => ({
    kakunin: Boolean(c.p1Kakunin),
    mashishime: Boolean(c.p1Mashishime),
    remarks: c.p1Remarks ?? '',
  })

  it('initializes and caches row forms from circuits', () => {
    const circuitsRef = ref(sampleCircuits as CircuitItem[])
    const { getRowForm } = usePhaseTableForm<TestForm>({
      circuits: circuitsRef,
      initForm,
      isConfirmedServer: c => Boolean(c.p1ConfirmedAt),
    })

    const form1 = getRowForm(sampleCircuits[0] as CircuitItem)

    expect(form1.kakunin).toBe(false)
    expect(form1.remarks).toBe('メモ1')

    const form2 = getRowForm(sampleCircuits[1] as CircuitItem)

    expect(form2.kakunin).toBe(true)
  })

  it('manages local clear and confirmation status correctly', () => {
    const circuitsRef = ref(sampleCircuits as CircuitItem[])
    const {
      isConfirmed,
      handleClearLocally,
      markConfirmedLocally,
    } = usePhaseTableForm<TestForm>({
      circuits: circuitsRef,
      initForm,
      isConfirmedServer: c => Boolean(c.p1ConfirmedAt),
    })

    const c2 = sampleCircuits[1] as CircuitItem

    expect(isConfirmed(c2)).toBe(true)

    // Clear locally (unconfirmedRowIds に追加)
    handleClearLocally(c2)
    expect(isConfirmed(c2)).toBe(false)

    // Mark confirmed locally
    markConfirmedLocally(c2)
    expect(isConfirmed(c2)).toBe(true)
  })

  it('evaluates isRowDisabled correctly', () => {
    const circuitsRef = ref(sampleCircuits as CircuitItem[])
    const isActionLoading = ref<Record<string, boolean>>({ 'c-1': false })

    const { isRowDisabled, handleClearLocally } = usePhaseTableForm<TestForm>({
      circuits: circuitsRef,
      initForm,
      isConfirmedServer: c => Boolean(c.p1ConfirmedAt),
      isActionLoading,
    })

    const c1 = sampleCircuits[0] as CircuitItem
    const c2 = sampleCircuits[1] as CircuitItem
    const c3 = sampleCircuits[2] as CircuitItem

    // c1 is unconfirmed, not excluded, not loading -> false
    expect(isRowDisabled(c1)).toBe(false)

    // c2 is confirmed -> true
    expect(isRowDisabled(c2)).toBe(true)

    // c2 cleared locally -> false
    handleClearLocally(c2)
    expect(isRowDisabled(c2)).toBe(false)

    // c3 is excluded -> true
    expect(isRowDisabled(c3)).toBe(true)

    // c1 is loading -> true
    isActionLoading.value['c-1'] = true
    expect(isRowDisabled(c1)).toBe(true)
  })
})
