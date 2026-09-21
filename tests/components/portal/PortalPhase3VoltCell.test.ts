import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PortalPhase3VoltCell from '../../../app/components/portal/molecules/Phase3VoltCell.vue'

describe('PortalPhase3VoltCell.vue', () => {
  it('renders normal display mode with formatted voltage and unit', () => {
    const wrapper = mount(PortalPhase3VoltCell, {
      props: {
        label: 'R - S',
        val: 200,
        isEditing: false,
      },
    })

    expect(wrapper.find('.cell-label').text()).toBe('R - S')
    expect(wrapper.find('.cell-val').text()).toBe('200')
    expect(wrapper.find('.cell-val').classes()).toContain('is-active')
    expect(wrapper.find('.cell-unit').text()).toBe('V')
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('renders editing mode with input group and hides normal value display', () => {
    const wrapper = mount(PortalPhase3VoltCell, {
      props: {
        label: 'R - S',
        val: 200,
        isEditing: true,
        modelValue: '200',
      },
    })

    expect(wrapper.find('.cell-label').text()).toBe('R - S')
    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.find('.cell-val').exists()).toBe(false)
  })

  it('renders fallback dash when val is null or undefined', () => {
    const wrapper = mount(PortalPhase3VoltCell, {
      props: {
        label: 'R - S',
        val: null,
        isEditing: false,
      },
    })

    expect(wrapper.find('.cell-val').text()).toBe('-')
    expect(wrapper.find('.cell-unit').exists()).toBe(false)
  })
})
