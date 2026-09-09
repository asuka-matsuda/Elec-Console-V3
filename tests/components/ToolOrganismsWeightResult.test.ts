import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OrganismsWeightResult from '../../app/components/tool/OrganismsWeightResult.vue'
import type { WeightCalcResult } from '../../app/utils/tools/weight/weightCalcLogic'

describe('ToolOrganismsWeightResult (app/components/tool/OrganismsWeightResult.vue)', () => {
  const commonStubs = {
    MoleculesResultBox: {
      props: ['title', 'status', 'isEmpty'],
      template: `
        <div class="result-box-stub" :class="[status, { 'is-empty': isEmpty }]">
          <div class="title">{{ title }}</div>
          <div class="value"><slot /></div>
          <div class="footer"><slot name="footer" /></div>
        </div>
      `,
    },
    MoleculesResultDetails: {
      props: ['items'],
      template: `
        <div class="result-details-stub">
          <div v-for="item in items" :key="item.label" class="detail-row">
            <span>{{ item.label }}</span>
            <span>{{ item.value }}</span>
            <span v-if="item.unit">{{ item.unit }}</span>
          </div>
        </div>
      `,
    },
  }

  it('renders successful result with expected drum id and details', () => {
    const mockResult: WeightCalcResult = {
      error: false,
      cableWeight: 120.5,
      bestDrum: {
        id: 'L1-1',
        category: 'L1',
        flange_diameter: 340,
        barrel_diameter: 200,
        outer_width: 300,
        inner_width: 240,
        shaft_hole: 50,
        weight: 5,
        max_winding_weight: 500,
      },
      maxCapacityMeters: 350.0,
    }

    const wrapper = mount(OrganismsWeightResult, {
      props: {
        result: mockResult,
      },
      global: {
        stubs: commonStubs,
      },
    })

    const title = wrapper.find('.title')

    expect(title.text()).toBe('使用ドラム（想定）')

    const text = wrapper.text()

    expect(text).toContain('L1-1')
    expect(text).toContain('120.5')
    expect(text).toContain('5')
    expect(text).toContain('125.5')
    expect(text).toContain('350.0')
  })

  it('renders unselectable drum state with warning', () => {
    const mockResult: WeightCalcResult = {
      error: false,
      cableWeight: 500,
      bestDrum: undefined,
    }

    const wrapper = mount(OrganismsWeightResult, {
      props: {
        result: mockResult,
      },
      global: {
        stubs: commonStubs,
      },
    })

    const text = wrapper.text()

    expect(text).toContain('選定不可')
    expect(text).toContain('条件に合うドラムが見つかりませんでした')
  })

  it('renders empty state when result is null', () => {
    const wrapper = mount(OrganismsWeightResult, {
      props: {
        result: null,
      },
      global: {
        stubs: commonStubs,
      },
    })

    const resultBox = wrapper.findComponent(commonStubs.MoleculesResultBox)

    expect(resultBox.props('isEmpty')).toBe(true)

    const details = wrapper.findComponent(commonStubs.MoleculesResultDetails)

    expect(details.exists()).toBe(false)
  })
})
