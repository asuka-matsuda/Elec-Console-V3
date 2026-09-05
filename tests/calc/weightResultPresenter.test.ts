import { describe, expect, it } from 'vitest'

import type { WeightCalcResult } from '../../app/utils/tools/weight/weightCalcLogic'
import { formatWeightResult } from '../../app/utils/tools/weight/weightResultPresenter'

describe('weightResultPresenter', () => {
  it('should return empty state when result is null or has error', () => {
    const vmNull = formatWeightResult(null)

    expect(vmNull.isError).toBe(true)
    expect(vmNull.displayDrum).toBe('---')
    expect(vmNull.boxStatus).toBe('empty')

    const vmErr = formatWeightResult({
      cableWeight: 0,
      error: '計算エラー',
    })

    expect(vmErr.isError).toBe(true)
    expect(vmErr.boxStatus).toBe('empty')
  })

  it('should format successful calculation with best drum', () => {
    const mockResult: WeightCalcResult = {
      cableWeight: 154.2,
      bestDrum: {
        id: 'D-12',
        category: '木製ドラム',
        weight: '45',
        flangeDia: 1200,
        barrelDia: 600,
        traverse: 800,
        cableCapacities: {},
      },
      maxCapacityMeters: 450.0,
    }

    const vm = formatWeightResult(mockResult)

    expect(vm.isError).toBe(false)
    expect(vm.hasBestDrum).toBe(true)
    expect(vm.boxStatus).toBe('success')
    expect(vm.displayDrum).toBe('木製ドラム (D-12)')
    expect(vm.warningText).toBe('')
    expect(vm.cableWeight).toBe('154.2')
    expect(vm.drumWeight).toBe('45')
    expect(vm.totalWeight).toBe('199.2') // 154.2 + 45.0
    expect(vm.maxCapacityMeters).toBe('450.0')
  })

  it('should handle state when no drum matches the conditions', () => {
    const mockResult: WeightCalcResult = {
      cableWeight: 800.0,
      bestDrum: undefined,
    }

    const vm = formatWeightResult(mockResult)

    expect(vm.isError).toBe(false)
    expect(vm.hasBestDrum).toBe(false)
    expect(vm.boxStatus).toBe('error')
    expect(vm.displayDrum).toBe('選定不可')
    expect(vm.warningText).toContain('条件に合うドラムが見つかりませんでした')
    expect(vm.cableWeight).toBe('800.0')
  })
})
