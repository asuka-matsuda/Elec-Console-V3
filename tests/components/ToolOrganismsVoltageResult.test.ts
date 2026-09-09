import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OrganismsVoltageResult from '../../app/components/tool/OrganismsVoltageResult.vue'
import type { VoltageCalcInputs, VoltageCalcResult } from '../../app/types/voltage'

describe('ToolOrganismsVoltageResult (app/components/tool/OrganismsVoltageResult.vue)', () => {
  const commonStubs = {
    MoleculesResultBox: {
      props: ['title', 'status', 'size'],
      template: `
        <div class="result-box-stub" :class="[status, size ? 'is-' + size : '']">
          <div class="title">{{ title }}</div>
          <div class="value"><slot /></div>
          <div class="footer"><slot name="footer" /></div>
        </div>
      `,
    },
  }

  it('renders voltage drop calculation mode correctly', () => {
    const mockInputs = {
      isReady: true,
      mode: 'drop',
      I: 15,
      sys: { key: '1P2W', name: '単相2線式', k: 2, voltage: 200 },
    } as unknown as VoltageCalcInputs

    const mockResult = {
      finalDropV: 2.34,
      finalEffAmp: 27,
      dropRate: 1.17,
      optimal: {
        name: 'CV 5.5sq',
        size: '5.5',
        unit: 'sq',
      },
    } as unknown as VoltageCalcResult

    const wrapper = mount(OrganismsVoltageResult, {
      props: {
        inputs: mockInputs,
        result: mockResult,
      },
      global: {
        stubs: commonStubs,
      },
    })

    const text = wrapper.text()

    expect(text).toContain('電圧降下')
    expect(text).toContain('2.34')
    expect(text).toContain('V')
    expect(text).toContain('1.17')
    expect(text).toContain('%')
    expect(text).toContain('15')
    expect(text).toContain('27')
    expect(text).toContain('A')
    expect(text).toContain('CV 5.5sq')
  })

  it('renders cable size selection mode correctly', () => {
    const mockInputs = {
      isReady: true,
      mode: 'size',
      I: 30,
      targetDrop: 2.0,
      sys: { key: '3P3W', name: '三相3線式', k: 1.732, voltage: 200 },
    } as unknown as VoltageCalcInputs

    const mockResult = {
      finalDropV: 3.12,
      finalEffAmp: 55,
      dropRate: 1.56,
      optimal: {
        name: 'CV 14sq',
        size: '14',
        unit: 'sq',
      },
    } as unknown as VoltageCalcResult

    const wrapper = mount(OrganismsVoltageResult, {
      props: {
        inputs: mockInputs,
        result: mockResult,
      },
      global: {
        stubs: commonStubs,
      },
    })

    const text = wrapper.text()

    expect(text).toContain('選定ケーブルサイズ')
    expect(text).toContain('14')
    expect(text).toContain('sq')
    expect(text).toContain('3.12')
    expect(text).toContain('1.56')
  })

  it('renders error and suggestion in footer when result has error', () => {
    const mockInputs = {
      isReady: true,
      mode: 'size',
      I: 1000,
      targetDrop: 1.0,
      sys: { key: '1P2W', name: '単相2線式', k: 2, voltage: 200 },
    } as unknown as VoltageCalcInputs

    const mockResult = {
      errorId: 'VOLTAGE_SIZE_OVER',
    } as unknown as VoltageCalcResult

    const wrapper = mount(OrganismsVoltageResult, {
      props: {
        inputs: mockInputs,
        result: mockResult,
      },
      global: {
        stubs: commonStubs,
      },
    })

    const text = wrapper.text()

    expect(text).toContain('目標電圧降下率を満たすケーブルサイズが対象種別の規格上限を超過')
  })

  it('applies is-sm class when size="sm"', () => {
    const mockInputs: VoltageCalcInputs = {
      system: '1P2W',
      voltage: 200,
      mode: 'drop',
      phase: 'single',
      wireCount: 2,
      targetDropRatio: 2,
      capacityType: 'current',
      current: 10,
      power: 0,
      pf: 1,
      cableType: 'CV-2C',
      size: '5.5',
      length: 30,
      wiresPerPhase: 1,
    }

    const wrapper = mount(OrganismsVoltageResult, {
      props: {
        inputs: mockInputs,
        result: null,
        size: 'sm',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.classes()).toContain('is-sm')
  })
})
