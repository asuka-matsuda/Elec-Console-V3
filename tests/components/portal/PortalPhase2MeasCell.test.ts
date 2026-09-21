import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PortalPhase2MeasCell from '../../../app/components/portal/molecules/Phase2MeasCell.vue'

describe('PortalPhase2MeasCell.vue', () => {
  it('renders normal display mode with formatted value and status badge', () => {
    const wrapper = mount(PortalPhase2MeasCell, {
      props: {
        label: 'R - S',
        val: 100,
        status: 'OK',
        isEditing: false,
      },
    })

    expect(wrapper.find('.cell-label').text()).toBe('R - S')
    expect(wrapper.find('.cell-val').text()).toBe('100')
    expect(wrapper.find('.cell-val').classes()).toContain('is-ok')
    expect(wrapper.find('.cell-unit').text()).toBe('MΩ')
    expect(wrapper.text()).toContain('OK')
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('renders editing mode with input and hides normal display', () => {
    const wrapper = mount(PortalPhase2MeasCell, {
      props: {
        label: 'R - S',
        val: 100,
        isEditing: true,
        modelValue: '100',
      },
    })

    expect(wrapper.find('.cell-label').text()).toBe('R - S')
    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.find('.cell-val').exists()).toBe(false)
  })

  it('renders fallback dash when val is null or undefined', () => {
    const wrapper = mount(PortalPhase2MeasCell, {
      props: {
        label: 'R - S',
        val: null,
        isEditing: false,
      },
    })

    expect(wrapper.find('.cell-val').text()).toBe('-')
    expect(wrapper.find('.cell-unit').exists()).toBe(false)
  })

  it('applies is-ng class when status is NG or value is below threshold', () => {
    const wrapper = mount(PortalPhase2MeasCell, {
      props: {
        label: 'R - S',
        val: 0.5,
        status: 'NG',
        isEditing: false,
      },
    })

    expect(wrapper.find('.cell-val').classes()).toContain('is-ng')
  })
})
