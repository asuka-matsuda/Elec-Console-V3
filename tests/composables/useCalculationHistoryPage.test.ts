import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCalculationHistoryPage } from '../../app/composables/tools/useCalculationHistoryPage'

// モック: useModal
const mockAskConfirm = vi.fn()
const mockApi = vi.fn()

vi.mock('../../app/composables/useModal', () => ({
  useModal: () => ({
    askConfirm: mockAskConfirm,
  }),
}))

vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $api: mockApi,
  }),
}))

describe('useCalculationHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.mockReset()
  })

  it('should initialize with default tab and empty list', () => {
    const page = useCalculationHistoryPage()

    expect(page.currentTab.value).toBe('voltage')
    expect(page.historyList.value).toEqual([])
    expect(page.tabs.length).toBe(4)
  })

  it('should load stored history from API on fetchHistory', async () => {
    const mockVoltageHist = [
      { id: 'v1', toolName: '電圧降下', timestamp: '2026-01-01' },
    ]

    mockApi.mockResolvedValueOnce({
      success: true,
      history: mockVoltageHist,
    })

    const page = useCalculationHistoryPage()

    await page.fetchHistory()

    expect(page.historyList.value).toEqual(mockVoltageHist)
    expect(mockApi).toHaveBeenCalledWith('/api/calc-history?toolId=voltage')
  })

  it('should delete a single item when confirmed', async () => {
    mockAskConfirm.mockResolvedValue(true)
    mockApi.mockResolvedValue({ success: true })

    const mockVoltageHist = [
      { id: 'v1', toolName: '電圧降下1', timestamp: '2026-01-01' },
      { id: 'v2', toolName: '電圧降下2', timestamp: '2026-01-02' },
    ]

    const page = useCalculationHistoryPage()

    page.historyList.value = [...mockVoltageHist]

    await page.openDeleteModal('v1')

    expect(page.historyList.value.length).toBe(1)
    expect(page.historyList.value[0].id).toBe('v2')
    expect(mockApi).toHaveBeenCalledWith('/api/calc-history?id=v1', { method: 'DELETE' })
  })

  it('should clear all items when clear-all confirmed', async () => {
    mockAskConfirm.mockResolvedValue(true)
    mockApi.mockResolvedValue({ success: true })

    const mockVoltageHist = [
      { id: 'v1', toolName: '電圧降下1', timestamp: '2026-01-01' },
    ]

    const page = useCalculationHistoryPage()

    page.historyList.value = [...mockVoltageHist]

    await page.handleClearAll()

    expect(page.historyList.value).toEqual([])
    expect(mockApi).toHaveBeenCalledWith('/api/calc-history?toolId=voltage', { method: 'DELETE' })
  })
})
