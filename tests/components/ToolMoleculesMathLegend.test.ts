import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ToolMoleculesMathLegend from '../../app/components/tool/MoleculesMathLegend.vue'

describe('ToolMoleculesMathLegend.vue', () => {
  it('does not render when items array is empty or undefined', () => {
    const wrapper = mount(ToolMoleculesMathLegend, {
      props: {
        items: [],
      },
    })

    expect(wrapper.find('div').exists()).toBe(false)
  })

  it('renders default title and parsed items correctly', () => {
    const items = [
      'e: 電圧降下 [V]',
      'L: 電線長 [m]',
    ]

    const wrapper = mount(ToolMoleculesMathLegend, {
      props: {
        items,
      },
    })

    expect(wrapper.text()).toContain('【凡例】')
    expect(wrapper.text()).toContain('電圧降下 [V]')
    expect(wrapper.text()).toContain('電線長 [m]')

    const dts = wrapper.findAll('dt')
    const dds = wrapper.findAll('dd')

    expect(dts.length).toBe(2)
    expect(dds.length).toBe(2)
    expect(dds[0].text()).toBe('電圧降下 [V]')
    expect(dds[1].text()).toBe('電線長 [m]')
  })

  it('renders custom title when provided', () => {
    const items = ['I: 電流 [A]']

    const wrapper = mount(ToolMoleculesMathLegend, {
      props: {
        items,
        title: '【記号の説明】',
      },
    })

    expect(wrapper.text()).toContain('【記号の説明】')
    expect(wrapper.text()).toContain('電流 [A]')
  })

  it('handles item without colon gracefully', () => {
    const items = ['※ 許容電流基準']

    const wrapper = mount(ToolMoleculesMathLegend, {
      props: {
        items,
      },
    })

    expect(wrapper.text()).toContain('※ 許容電流基準')
  })
})
