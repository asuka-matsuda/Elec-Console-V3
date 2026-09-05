import { describe, expect, it } from 'vitest'

import type { RackCalcResult } from '../../app/utils/tools/rack/rackCalcLogic'
import { formatRackResult } from '../../app/utils/tools/rack/rackResultPresenter'

describe('rackResultPresenter', () => {
  it('should return empty state when no input is provided or error occurs', () => {
    const vmNoInput = formatRackResult({
      result: null,
      maxDepth: 100,
      isStrong: false,
      isWeak: false,
    })

    expect(vmNoInput.isEmpty).toBe(true)
    expect(vmNoInput.displaySize).toBe('---')
    expect(vmNoInput.boxVariant).toBe('default')

    const vmError = formatRackResult({
      result: {
        error: '入力エラー',
        wStrong: 0,
        wWeak: 0,
        wSep: 0,
        totalWidth: 0,
        maxCableStackHeight: 0,
        isOverflow: false,
      },
      maxDepth: 100,
      isStrong: true,
      isWeak: false,
    })

    expect(vmError.isEmpty).toBe(true)
    expect(vmError.displaySize).toBe('---')
    expect(vmError.boxVariant).toBe('error')
  })

  it('should format selected size correctly with separator', () => {
    const mockResult: RackCalcResult = {
      selectedSize: 300,
      wStrong: 120.4,
      wWeak: 80.2,
      wSep: 30.0,
      totalWidth: 230.6,
      maxCableStackHeight: 45.0,
      isOverflow: false,
    }

    const vm = formatRackResult({
      result: mockResult,
      maxDepth: 100,
      isStrong: true,
      isWeak: true,
    })

    expect(vm.isEmpty).toBe(false)
    expect(vm.displaySize).toBe('W300')
    expect(vm.boxVariant).toBe('default')
    expect(vm.showSeparator).toBe(true)
    expect(vm.wStrong).toBe('120.4')
    expect(vm.wWeak).toBe('80.2')
    expect(vm.wSep).toBe('30.0')
    expect(vm.totalWidth).toBe('231')
    expect(vm.maxHeight).toBe('45.0')
    expect(vm.isOverflow).toBe(false)
    expect(vm.overflowWarning).toBe('')
  })

  it('should handle out of standard size and overflow correctly', () => {
    const mockResult: RackCalcResult = {
      selectedSize: undefined,
      wStrong: 650.0,
      wWeak: 0,
      wSep: 0,
      totalWidth: 650.0,
      maxCableStackHeight: 120.0,
      isOverflow: true,
    }

    const vm = formatRackResult({
      result: mockResult,
      maxDepth: 100,
      isStrong: true,
      isWeak: false,
    })

    expect(vm.isEmpty).toBe(false)
    expect(vm.displaySize).toBe('規格外 (650mm以上)')
    expect(vm.showSeparator).toBe(false)
    expect(vm.isOverflow).toBe(true)
    expect(vm.overflowWarning).toContain('超過しています')
  })
})
