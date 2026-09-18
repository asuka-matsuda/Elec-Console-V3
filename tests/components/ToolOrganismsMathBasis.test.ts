import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ToolOrganismsMathBasis from '../../app/components/tool/OrganismsMathBasis.vue'

describe('ToolOrganismsMathBasis.vue', () => {
  const commonStubs = {
    Panel: {
      template: '<div class="panel-stub"><slot /></div>',
    },
    SectionHeader: {
      props: ['title', 'size'],
      template: '<div class="section-header-stub">{{ title }}</div>',
    },
    ClientOnly: {
      template: '<div><slot /></div>',
    },
  }

  it('renders steps and legends correctly', () => {
    const steps = [
      {
        title: '計算式1: 電圧降下の計算',
        tex: 'e = \\frac{17.8 \\cdot L \\cdot I}{1000 \\cdot A}',
        legend: [
          'e: 電圧降下 [V]',
          'L: 電線長 [m]',
          'I: 電流 [A]',
          'A: 導体断面積 [mm²]',
        ],
      },
    ]

    const wrapper = mount(ToolOrganismsMathBasis, {
      props: {
        steps,
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('計算式1: 電圧降下の計算')
    expect(wrapper.text()).toContain('【凡例】')
    expect(wrapper.text()).toContain('電圧降下 [V]')
    expect(wrapper.text()).toContain('電線長 [m]')
  })

  it('renders default slot content when provided', () => {
    const wrapper = mount(ToolOrganismsMathBasis, {
      slots: {
        default: '<div class="extra-content">補足情報テキスト</div>',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('補足情報テキスト')
  })
})
