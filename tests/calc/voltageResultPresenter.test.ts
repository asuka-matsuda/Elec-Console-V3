import { describe, expect, it } from 'vitest'

import type { VoltageCalcInputs, VoltageCalcResult } from '../../app/types/voltage'
import { formatVoltageResult } from '../../app/utils/tools/voltage/voltageResultPresenter'

describe('voltageResultPresenter', () => {
  it('should return placeholders when inputs are not ready', () => {
    const vm = formatVoltageResult(null, null)

    expect(vm.isReady).toBe(false)
    expect(vm.mainValue).toBe('ーー')
    expect(vm.mainStatusClass).toBe('is-neutral')
    expect(vm.currentI).toBe('ーー')
    expect(vm.maxI).toBe('ーー')
    expect(vm.dropV).toBe('ーー')
    expect(vm.dropPercent).toBe('ーー')
  })

  it('should format voltage drop mode correctly', () => {
    const mockInputs: Partial<VoltageCalcInputs> = {
      isReady: true,
      mode: 'drop',
      I: 20,
      sys: { key: '1P2W', name: '単相2線式', k: 2, voltage: 100 },
    }
    const mockResult: Partial<VoltageCalcResult> = {
      finalDropV: 2.45,
      finalEffAmp: 30,
      optimal: {
        name: 'CV 8sq',
        size: '8',
        unit: 'sq',
      } as unknown as NonNullable<VoltageCalcResult['optimal']>,
    }

    const vm = formatVoltageResult(
      mockInputs as VoltageCalcInputs,
      mockResult as VoltageCalcResult,
    )

    expect(vm.isReady).toBe(true)
    expect(vm.mode).toBe('drop')
    expect(vm.mainLabel).toBe('電圧降下')
    expect(vm.mainValue).toBe('2.45')
    expect(vm.mainUnit).toBe('V')
    expect(vm.mainStatusClass).toBe('is-success')
    expect(vm.currentI).toBe('20')
    expect(vm.maxI).toBe('30')
    expect(vm.ampStatusClass).toBe('is-success')
    expect(vm.dropV).toBe('2.45')
    expect(vm.dropPercent).toBe('2.45')
    expect(vm.dropCableName).toBe('CV 8sq')
  })

  it('should format size selection mode correctly', () => {
    const mockInputs: Partial<VoltageCalcInputs> = {
      isReady: true,
      mode: 'size',
      I: 25,
      targetDrop: 3.0,
      sys: { key: '1P2W', name: '単相2線式', k: 2, voltage: 100 },
    }
    const mockResult: Partial<VoltageCalcResult> = {
      finalDropV: 2.1,
      finalEffAmp: 35,
      optimal: {
        name: 'CV 14sq',
        size: '14',
        unit: 'sq',
      } as unknown as NonNullable<VoltageCalcResult['optimal']>,
    }

    const vm = formatVoltageResult(
      mockInputs as VoltageCalcInputs,
      mockResult as VoltageCalcResult,
    )

    expect(vm.isReady).toBe(true)
    expect(vm.mode).toBe('size')
    expect(vm.mainLabel).toBe('選定ケーブルサイズ')
    expect(vm.mainValue).toBe('14')
    expect(vm.mainUnit).toBe('sq')
    expect(vm.mainStatusClass).toBe('is-success')
    expect(vm.dropStatusClass).toBe('is-success')
  })

  it('should flag is-danger when design current exceeds allowable ampacity', () => {
    const mockInputs: Partial<VoltageCalcInputs> = {
      isReady: true,
      mode: 'drop',
      I: 50,
      sys: { key: '1P2W', name: '単相2線式', k: 2, voltage: 100 },
    }
    const mockResult: Partial<VoltageCalcResult> = {
      finalDropV: 3.5,
      finalEffAmp: 40,
    }

    const vm = formatVoltageResult(
      mockInputs as VoltageCalcInputs,
      mockResult as VoltageCalcResult,
    )

    expect(vm.ampStatusClass).toBe('is-danger')
    expect(vm.mainStatusClass).toBe('is-danger')
  })
})
