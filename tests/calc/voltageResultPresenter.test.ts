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
    expect(vm.dropRateText).toBe('ーー')
    expect(vm.dropCableName).toBe('ーー')
  })

  it('should show dropCableName immediately when selectedCableName is present even if inputs are not ready', () => {
    const mockInputs: Partial<VoltageCalcInputs> = {
      isReady: false,
      mode: 'drop',
      selectedCableName: 'CV 5.5sq -3C',
    }
    const vm = formatVoltageResult(mockInputs as VoltageCalcInputs, null)

    expect(vm.isReady).toBe(false)
    expect(vm.dropCableName).toBe('CV 5.5sq -3C')
    expect(vm.dropPercent).toBe('ーー')
    expect(vm.dropRateText).toBe('ーー')
    expect(vm.mainValue).toBe('ーー')
  })

  it('should format voltage drop mode correctly', () => {
    const mockInputs: Partial<VoltageCalcInputs> = {
      isReady: true,
      mode: 'drop',
      I: 20,
      sys: { id: '1P2W100', label: '単相2線式 100V', voltage: 100 } as unknown as VoltageCalcInputs['sys'],
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
    expect(vm.dropRateText).toBe('2.45%')
    expect(vm.dropCableName).toBe('CV 8sq')
  })

  it('should format dropRateText with both 100V and 200V for 1P3W system', () => {
    const mockInputs: Partial<VoltageCalcInputs> = {
      isReady: true,
      mode: 'drop',
      I: 8,
      sys: { id: '1P3W200', label: '単相3線式 100/200V', voltage: 100 } as unknown as VoltageCalcInputs['sys'],
    }
    const mockResult: Partial<VoltageCalcResult> = {
      finalDropV: 2.03,
      finalEffAmp: 18,
      optimal: {
        name: 'VVF 2.0mm -2C',
        size: '2.0',
        unit: 'mm',
      } as unknown as NonNullable<VoltageCalcResult['optimal']>,
    }

    const vm = formatVoltageResult(
      mockInputs as VoltageCalcInputs,
      mockResult as VoltageCalcResult,
    )

    expect(vm.isReady).toBe(true)
    expect(vm.dropV).toBe('2.03')
    expect(vm.dropPercent).toBe('2.03')
    // 100V基準: 2.03%, 200V基準: 1.01% (2.03 / 2 = 1.015 -> 1.01%)
    expect(vm.dropRateText).toBe('2.03% (1.01%)')
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

  it('should handle VOLTAGE_TARGET_DROP_OVER with is-warning and 降下率超過 on all 3 cards', () => {
    const mockInputs: Partial<VoltageCalcInputs> = {
      isReady: true,
      mode: 'size',
      I: 8,
      targetDrop: 2.0,
      sys: { key: '1P3W', name: '単相3線式', k: 1, voltage: 100 },
    }
    const mockResult: Partial<VoltageCalcResult> = {
      optimal: {
        name: 'VVF 2.0mm -4C',
        size: '2.0',
        unit: 'mm',
      } as unknown as NonNullable<VoltageCalcResult['optimal']>,
      errorId: 'VOLTAGE_TARGET_DROP_OVER',
      finalDropV: 2.03,
      finalEffAmp: 17,
    }

    const vm = formatVoltageResult(
      mockInputs as VoltageCalcInputs,
      mockResult as VoltageCalcResult,
    )

    expect(vm.isReady).toBe(true)
    // 1. 選定サイズ
    expect(vm.mainValue).toBe('2.0')
    expect(vm.mainUnit).toBe('mm')
    expect(vm.mainStatusClass).toBe('is-warning')
    expect(vm.mainBadgeText).toBe('降下率超過')

    // 2. 電流チェック
    expect(vm.currentI).toBe('8')
    expect(vm.maxI).toBe('17')
    expect(vm.ampStatusClass).toBe('is-warning')
    expect(vm.ampBadgeText).toBe('降下率超過')

    // 3. 電圧降下
    expect(vm.dropV).toBe('2.03')
    expect(vm.dropPercent).toBe('2.03')
    expect(vm.dropStatusClass).toBe('is-warning')
    expect(vm.dropBadgeText).toBe('降下率超過')
  })

  it('should handle VOLTAGE_AMP_OVER with is-danger and 許容電流不足 on all 3 cards', () => {
    const mockInputs: Partial<VoltageCalcInputs> = {
      isReady: true,
      mode: 'size',
      I: 30,
      targetDrop: 2.0,
      sys: { key: '1P3W', name: '単相3線式', k: 1, voltage: 100 },
    }
    const mockResult: Partial<VoltageCalcResult> = {
      optimal: null,
      errorId: 'VOLTAGE_AMP_OVER',
      finalDropV: 0,
      finalEffAmp: 17,
    }

    const vm = formatVoltageResult(
      mockInputs as VoltageCalcInputs,
      mockResult as VoltageCalcResult,
    )

    expect(vm.isReady).toBe(true)
    // 1. 選定サイズ
    expect(vm.mainValue).toBe('ERROR')
    expect(vm.mainUnit).toBe('')
    expect(vm.mainStatusClass).toBe('is-danger')
    expect(vm.mainBadgeText).toBe('許容電流不足')

    // 2. 電流チェック
    expect(vm.currentI).toBe('30')
    expect(vm.maxI).toBe('17')
    expect(vm.ampStatusClass).toBe('is-danger')
    expect(vm.ampBadgeText).toBe('許容電流不足')

    // 3. 電圧降下
    expect(vm.dropV).toBe('ERROR')
    expect(vm.dropPercent).toBe('')
    expect(vm.dropStatusClass).toBe('is-danger')
    expect(vm.dropBadgeText).toBe('許容電流不足')
  })

  it('should handle oversize selection error with errorInfo and is-danger', () => {
    const mockInputs: Partial<VoltageCalcInputs> = {
      isReady: true,
      mode: 'size',
      I: 10,
      targetDrop: 2.0,
      sys: { key: '1P3W', name: '単相3線式', k: 1, voltage: 100 },
    }
    const mockResult: Partial<VoltageCalcResult> = {
      optimal: null,
      errorId: 'VOLTAGE_SIZE_OVER',
      finalDropV: 0,
      finalEffAmp: 0,
    }

    const vm = formatVoltageResult(
      mockInputs as VoltageCalcInputs,
      mockResult as VoltageCalcResult,
    )

    expect(vm.isReady).toBe(true)
    // 1. 選定サイズ
    expect(vm.mainValue).toBe('ERROR')
    expect(vm.mainBadgeText).toBe('規格外')
    expect(vm.mainUnit).toBe('')
    expect(vm.mainStatusClass).toBe('is-danger')

    // 2. 電流チェック
    expect(vm.currentI).toBe('ERROR')
    expect(vm.maxI).toBe('ERROR')
    expect(vm.ampStatusClass).toBe('is-danger')
    expect(vm.ampBadgeText).toBe('規格外')

    // 3. 電圧降下
    expect(vm.dropV).toBe('ERROR')
    expect(vm.dropPercent).toBe('')
    expect(vm.dropStatusClass).toBe('is-danger')
    expect(vm.dropBadgeText).toBe('規格外')

    expect(vm.errorInfo).toBeDefined()
    expect(vm.errorInfo?.id).toBe('VOLTAGE_SIZE_OVER')
    expect(vm.errorInfo?.message).toContain('規格上限を超過')
  })
})
