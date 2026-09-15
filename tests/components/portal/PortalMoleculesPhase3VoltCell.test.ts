import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PortalMoleculesPhase3VoltCell from '../../../app/components/portal/MoleculesPhase3VoltCell.vue'

describe('PortalMoleculesPhase3VoltCell.vue', () => {
  it('renders normal display mode with formatted voltage and unit', () => {
    const wrapper = mount(PortalMoleculesPhase3VoltCell, {
      props: {
        label: 'R - S',
        val: 200,
        isEditing: false,
      },
    })

    expect(wrapper.find('.volt-label').text()).toBe('R - S')
    expect(wrapper.find('.volt-val').text()).toBe('200')
    expect(wrapper.find('.volt-unit').text()).toBe('V')
    expect(wrapper.find('.input-label').exists()).toBe(false)
  })

  it('renders editing mode with input group', () => {
    const wrapper = mount(PortalMoleculesPhase3VoltCell, {
      props: {
        label: 'R - S',
        val: 200,
        isEditing: true,
        modelValue: '200',
      },
    })

    expect(wrapper.find('.input-label').text()).toBe('R - S')
    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.find('.volt-label').exists()).toBe(false)
  })

  it('renders fallback dash when val is null or undefined', () => {
    const wrapper = mount(PortalMoleculesPhase3VoltCell, {
      props: {
        label: 'R - S',
        val: null,
        isEditing: false,
      },
    })

    expect(wrapper.find('.volt-val').text()).toBe('-')
    expect(wrapper.find('.volt-unit').exists()).toBe(false)
  })
})
