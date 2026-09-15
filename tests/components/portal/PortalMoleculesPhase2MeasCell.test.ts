import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PortalMoleculesPhase2MeasCell from '../../../app/components/portal/MoleculesPhase2MeasCell.vue'

describe('PortalMoleculesPhase2MeasCell.vue', () => {
  it('renders normal display mode with formatted value and status badge', () => {
    const wrapper = mount(PortalMoleculesPhase2MeasCell, {
      props: {
        label: 'R - S',
        val: 100,
        status: 'OK',
        isEditing: false,
      },
    })

    expect(wrapper.find('.meas-label').text()).toBe('R - S')
    expect(wrapper.find('.meas-val').text()).toBe('100')
    expect(wrapper.find('.meas-unit').text()).toBe('MΩ')
    expect(wrapper.text()).toContain('OK')
    expect(wrapper.find('.input-label').exists()).toBe(false)
  })

  it('renders editing mode with input group', () => {
    const wrapper = mount(PortalMoleculesPhase2MeasCell, {
      props: {
        label: 'R - S',
        val: 100,
        isEditing: true,
        modelValue: '100',
      },
    })

    expect(wrapper.find('.input-label').text()).toBe('R - S')
    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.find('.meas-label').exists()).toBe(false)
  })

  it('renders fallback dash when val is null or undefined', () => {
    const wrapper = mount(PortalMoleculesPhase2MeasCell, {
      props: {
        label: 'R - S',
        val: null,
        isEditing: false,
      },
    })

    expect(wrapper.find('.meas-val').text()).toBe('-')
    expect(wrapper.find('.meas-unit').exists()).toBe(false)
  })
})
