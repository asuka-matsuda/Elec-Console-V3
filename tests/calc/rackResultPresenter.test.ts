import { describe, expect, it } from 'vitest'

import type { RackCalcResult } from '../../app/utils/tools/rack/rackCalcLogic'
import { formatRackResult } from '../../app/utils/tools/rack/rackResultPresenter'

describe('rackResultPresenter', () => {
  it('should return empty state when no input is provided or error occurs', () => {
    const vmNoInput = formatRackResult({
      result: null,
      maxDepth: 100,
      mode: 'strong',
    })

    expect(vmNoInput.isEmpty).toBe(true)
    expect(vmNoInput.displaySize).toBe('---')
    expect(vmNoInput.boxVariant).toBe('default')

    const vmError = formatRackResult({
      result: {
        mode: 'strong',
        error: true,
        wStrong: 0,
        wWeak: 0,
        wSep: 0,
        totalWidth: 0,
        selectedSize: null,
        maxCableStackHeight: 0,
        maxStackDetailStr: '0',
        maxDepth: 100,
        rackHeight: 110,
        sumStrong: 0,
        sumWeak: 0,
        isOverflow: false,
      },
      maxDepth: 100,
      mode: 'strong',
    },
    )

    expect(vmError.isEmpty).toBe(true)
    expect(vmError.displaySize).toBe('---')
    expect(vmError.boxVariant).toBe('error')
  })

  it('should format selected size correctly with width details', () => {
    const mockResult: RackCalcResult = {
      mode: 'strong',
      error: false,
      selectedSize: 300,
      wStrong: 120.4,
      wWeak: 80.2,
      wSep: 0,
      totalWidth: 200.6,
      maxCableStackHeight: 45.0,
      maxStackDetailStr: '45.0',
      maxDepth: 100,
      rackHeight: 110,
      sumStrong: 100,
      sumWeak: 0,
      isOverflow: false,
      marginRate: 1.2,
      cableSpacing: 10,
      sideMargin: 60,
      totalCablesCount: 3,
      tier1: {
        layers: 1,
        title: '1段敷設（平置き・標準）',
        isApplicable: true,
        wMain: 120.4,
        wOther: 80.2,
        totalWidth: 200.6,
        selectedSize: 300,
        isOverflow: false,
        isSizeOver: false,
        maxCableStackHeight: 45.0,
        stackHeightDetailStr: '45.0',
        cablesWidth: 50.3,
        cablesCount: 3,
      },
      tier2: {
        layers: 2,
        title: '2段敷設（省スペース）',
        isApplicable: true,
        wMain: 90.0,
        wOther: 80.2,
        totalWidth: 170.2,
        selectedSize: 200,
        isOverflow: false,
        isSizeOver: false,
        maxCableStackHeight: 70.0,
        stackHeightDetailStr: '45.0 + 25.0',
        cablesWidth: 25.0,
        cablesCount: 3,
      },
    }

    const vm = formatRackResult({
      result: mockResult,
      maxDepth: 100,
      mode: 'strong',
    })

    expect(vm.isEmpty).toBe(false)
    expect(vm.tier1.displaySize).toBe('W300')
    expect(vm.tier1.boxStatus).toBe('success')
    expect(vm.tier2.displaySize).toBe('W200')
    expect(vm.tier2.boxStatus).toBe('success')
    expect(vm.wStrong).toBe('120.4')
    expect(vm.wWeak).toBe('80.2')
    expect(vm.totalWidth).toBe('201')
    expect(vm.maxHeight).toBe('45.0')
    expect(vm.isOverflow).toBe(false)
    expect(vm.isSizeOver).toBe(false)
  })

  it('should handle height overflow (boxStatus: warning) when within standard size', () => {
    const mockResult: RackCalcResult = {
      mode: 'strong',
      error: false,
      selectedSize: 400,
      wStrong: 350.0,
      wWeak: 0,
      wSep: 0,
      totalWidth: 350.0,
      maxCableStackHeight: 90.0,
      maxStackDetailStr: '90.0',
      maxDepth: 80,
      rackHeight: 100,
      sumStrong: 200,
      sumWeak: 0,
      isOverflow: true,
    }

    const vm = formatRackResult({
      result: mockResult,
      maxDepth: 80,
      mode: 'strong',
    })

    expect(vm.isEmpty).toBe(false)
    expect(vm.displaySize).toBe('W400')
    expect(vm.isOverflow).toBe(true)
    expect(vm.isSizeOver).toBe(false)
    expect(vm.boxStatus).toBe('warning')
  })

  it('should handle out of standard size (boxStatus: danger)', () => {
    const mockResult: RackCalcResult = {
      mode: 'strong',
      error: true,
      selectedSize: null,
      wStrong: 1300.0,
      wWeak: 0,
      wSep: 0,
      totalWidth: 1300.0,
      maxCableStackHeight: 50.0,
      maxStackDetailStr: '50.0',
      maxDepth: 80,
      rackHeight: 100,
      sumStrong: 800,
      sumWeak: 0,
      isOverflow: false,
    }

    const vm = formatRackResult({
      result: mockResult,
      maxDepth: 80,
      mode: 'strong',
    })

    expect(vm.isEmpty).toBe(false)
    expect(vm.displaySize).toBe('規格外 (1300mm以上)')
    expect(vm.isSizeOver).toBe(true)
    expect(vm.boxStatus).toBe('danger')
  })
})
