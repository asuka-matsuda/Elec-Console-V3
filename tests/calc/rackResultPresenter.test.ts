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
    expect(vmNoInput.tier1.displaySize).toBe('---')
    expect(vmNoInput.tier2.displaySize).toBe('---')

    const vmError = formatRackResult({
      result: {
        mode: 'strong',
        error: true,
        maxDepth: 100,
        rackHeight: 110,
        marginRate: 1.2,
        cableSpacing: 10,
        sideMargin: 60,
        totalCablesCount: 0,
        tier1: {
          layers: 1,
          title: '1段敷設（平置き・標準）',
          isApplicable: true,
          wMain: 0,
          wOther: 0,
          totalWidth: 0,
          selectedSize: null,
          isOverflow: false,
          isSizeOver: false,
          maxCableStackHeight: 0,
          stackHeightDetailStr: '0',
          cablesWidth: 0,
          cablesCount: 0,
        },
        tier2: {
          layers: 2,
          title: '2段敷設（省スペース）',
          isApplicable: false,
          wMain: 0,
          wOther: 0,
          totalWidth: 0,
          selectedSize: null,
          isOverflow: false,
          isSizeOver: false,
          maxCableStackHeight: 0,
          stackHeightDetailStr: '0',
          cablesWidth: 0,
          cablesCount: 0,
        },
      },
      maxDepth: 100,
      mode: 'strong',
    })

    expect(vmError.isEmpty).toBe(true)
    expect(vmError.tier1.displaySize).toBe('---')
    expect(vmError.tier2.displaySize).toBe('---')
  })

  it('should format selected size correctly with width details', () => {
    const mockResult: RackCalcResult = {
      mode: 'strong',
      error: false,
      maxDepth: 100,
      rackHeight: 110,
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
    expect(vm.tier1.panelStatus).toBe('success')
    expect(vm.tier2.displaySize).toBe('W200')
    expect(vm.tier2.panelStatus).toBe('success')
    expect(vm.wStrong).toBe('120.4')
    expect(vm.wWeak).toBe('80.2')
  })

  it('should handle height overflow (panelStatus: warning) when within standard size', () => {
    const mockResult: RackCalcResult = {
      mode: 'strong',
      error: false,
      maxDepth: 80,
      rackHeight: 100,
      marginRate: 1.2,
      cableSpacing: 10,
      sideMargin: 60,
      totalCablesCount: 4,
      tier1: {
        layers: 1,
        title: '1段敷設（平置き・標準）',
        isApplicable: true,
        wMain: 350.0,
        wOther: 0,
        totalWidth: 350.0,
        selectedSize: 400,
        isOverflow: true,
        isSizeOver: false,
        maxCableStackHeight: 90.0,
        stackHeightDetailStr: '90.0',
        cablesWidth: 200,
        cablesCount: 4,
      },
      tier2: {
        layers: 2,
        title: '2段敷設（省スペース）',
        isApplicable: true,
        wMain: 250.0,
        wOther: 0,
        totalWidth: 250.0,
        selectedSize: 300,
        isOverflow: true,
        isSizeOver: false,
        maxCableStackHeight: 90.0,
        stackHeightDetailStr: '90.0',
        cablesWidth: 150,
        cablesCount: 4,
      },
    }

    const vm = formatRackResult({
      result: mockResult,
      maxDepth: 80,
      mode: 'strong',
    })

    expect(vm.isEmpty).toBe(false)
    expect(vm.tier1.displaySize).toBe('W400')
    expect(vm.tier1.isOverflow).toBe(true)
    expect(vm.tier1.isSizeOver).toBe(false)
    expect(vm.tier1.panelStatus).toBe('warning')
  })

  it('should handle out of standard size (panelStatus: danger)', () => {
    const mockResult: RackCalcResult = {
      mode: 'strong',
      error: true,
      maxDepth: 80,
      rackHeight: 100,
      marginRate: 1.2,
      cableSpacing: 10,
      sideMargin: 60,
      totalCablesCount: 10,
      tier1: {
        layers: 1,
        title: '1段敷設（平置き・標準）',
        isApplicable: true,
        wMain: 1300.0,
        wOther: 0,
        totalWidth: 1300.0,
        selectedSize: null,
        isOverflow: false,
        isSizeOver: true,
        maxCableStackHeight: 50.0,
        stackHeightDetailStr: '50.0',
        cablesWidth: 800,
        cablesCount: 10,
      },
      tier2: {
        layers: 2,
        title: '2段敷設（省スペース）',
        isApplicable: true,
        wMain: 1300.0,
        wOther: 0,
        totalWidth: 1300.0,
        selectedSize: null,
        isOverflow: false,
        isSizeOver: true,
        maxCableStackHeight: 50.0,
        stackHeightDetailStr: '50.0',
        cablesWidth: 800,
        cablesCount: 10,
      },
    }

    const vm = formatRackResult({
      result: mockResult,
      maxDepth: 80,
      mode: 'strong',
    })

    expect(vm.isEmpty).toBe(false)
    expect(vm.tier1.displaySize).toBe('ERROR')
    expect(vm.tier1.isSizeOver).toBe(true)
    expect(vm.tier1.panelStatus).toBe('danger')
  })
})
