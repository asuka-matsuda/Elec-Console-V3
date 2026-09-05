import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCalculationHistoryPage } from '../../app/composables/tools/useCalculationHistoryPage'

// モック: useModal
const mockAskConfirm = vi.fn()

vi.mock('../../app/composables/useModal', () => ({
  useModal: () => ({
    askConfirm: mockAskConfirm,
  }),
}))

describe('useCalculationHistoryPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should initialize with default tab and empty list', () => {
    const page = useCalculationHistoryPage()

    expect(page.currentTab.value).toBe('voltage')
    expect(page.historyList.value).toEqual([])
    expect(page.tabs.length).toBe(2)
  })

  it('should load stored history from localStorage on tab change', () => {
    const mockVoltageHist = [
      { id: 'v1', toolName: '電圧降下', timestamp: '2026-01-01' },
    ]

    localStorage.setItem(
      'elec_calc_voltage_hist',
      JSON.stringify(mockVoltageHist),
    )

    const page = useCalculationHistoryPage()

    expect(page.historyList.value).toEqual(mockVoltageHist)
  })

  it('should delete a single item when confirmed', async () => {
    mockAskConfirm.mockResolvedValue(true)

    const mockVoltageHist = [
      { id: 'v1', toolName: '電圧降下1', timestamp: '2026-01-01' },
      { id: 'v2', toolName: '電圧降下2', timestamp: '2026-01-02' },
    ]

    localStorage.setItem(
      'elec_calc_voltage_hist',
      JSON.stringify(mockVoltageHist),
    )

    const page = useCalculationHistoryPage()

    await page.openDeleteModal('v1')

    expect(page.historyList.value.length).toBe(1)
    expect(page.historyList.value[0].id).toBe('v2')
  })

  it('should clear all items when clear-all confirmed', async () => {
    mockAskConfirm.mockResolvedValue(true)

    const mockVoltageHist = [
      { id: 'v1', toolName: '電圧降下1', timestamp: '2026-01-01' },
    ]

    localStorage.setItem(
      'elec_calc_voltage_hist',
      JSON.stringify(mockVoltageHist),
    )

    const page = useCalculationHistoryPage()

    await page.handleClearAll()

    expect(page.historyList.value).toEqual([])
  })
})
