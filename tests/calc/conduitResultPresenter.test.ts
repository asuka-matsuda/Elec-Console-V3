import { describe, expect, it } from 'vitest'

import type { ConduitCalcResult } from '../../app/utils/tools/conduit/conduitCalcLogic'
import { formatConduitResult } from '../../app/utils/tools/conduit/conduitResultPresenter'

describe('conduitResultPresenter', () => {
  it('should return empty placeholders when result is null or partial', () => {
    const vmNull = formatConduitResult(null)

    expect(vmNull.isReady).toBe(false)
    expect(vmNull.size32).toBe('ーー')
    expect(vmNull.status32Class).toBe('is-neutral')
    expect(vmNull.fill32).toBe('ーー')
    expect(vmNull.size48).toBe('ーー')
    expect(vmNull.status48Class).toBe('is-neutral')
    expect(vmNull.fill48).toBe('ーー')

    const vmPartial = formatConduitResult({
      success: true,
      partial: true,
      totalArea: 100,
      cableDetails: [],
    })

    expect(vmPartial.isReady).toBe(false)
    expect(vmPartial.size32).toBe('ーー')
  })

  it('should format successful calculation result correctly', () => {
    const mockResult: ConduitCalcResult = {
      success: true,
      partial: false,
      conduit32: {
        category: 'e',
        name: 'E25',
        size: 'E25',
        innerDiameter: 23.2,
        area: 422.7,
      },
      fill32: 28.5,
      allowable32: 135.3,
      isOversize32: false,
      conduit48: {
        category: 'e',
        name: 'E19',
        size: 'E19',
        innerDiameter: 17.0,
        area: 226.9,
      },
      fill48: 42.1,
      allowable48: 108.9,
      isOversize48: false,
      totalArea: 95.0,
      cableDetails: [],
    }

    const vm = formatConduitResult(mockResult)

    expect(vm.isReady).toBe(true)
    expect(vm.isOversize32).toBe(false)
    expect(vm.isOversize48).toBe(false)
    expect(vm.size32).toBe('E25')
    expect(vm.status32Class).toBe('is-success')
    expect(vm.fill32).toBe('28.5')
    expect(vm.allowable32).toBe('135.3')
    expect(vm.size48).toBe('E19')
    expect(vm.status48Class).toBe('is-success')
    expect(vm.fill48).toBe('42.1')
    expect(vm.allowable48).toBe('108.9')
  })

  it('should handle oversize flags properly', () => {
    const mockResult: ConduitCalcResult = {
      success: true,
      partial: false,
      isOversize32: true,
      fill32: 35.0,
      conduit32: undefined,
      isOversize48: false,
      fill48: 40.0,
      conduit48: {
        category: 'g',
        name: 'G104',
        size: 'G104',
        innerDiameter: 100,
        area: 7854,
      },
      totalArea: 2800,
      cableDetails: [],
    }

    const vm = formatConduitResult(mockResult)

    expect(vm.isReady).toBe(true)
    expect(vm.isOversize32).toBe(true)
    expect(vm.size32).toBe('サイズ超過')
    expect(vm.status32Class).toBe('is-danger')

    expect(vm.isOversize48).toBe(false)
    expect(vm.size48).toBe('G104')
    expect(vm.status48Class).toBe('is-success')
  })
})
