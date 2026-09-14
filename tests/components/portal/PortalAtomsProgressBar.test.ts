import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PortalAtomsProgressBar from '../../../app/components/portal/AtomsProgressBar.vue'

describe('PortalAtomsProgressBar.vue', () => {
  it('renders progressbar with correct width percentage', () => {
    const wrapper = mount(PortalAtomsProgressBar, {
      props: {
        value: 50,
        max: 100,
      },
    })

    const fill = wrapper.find('.bar-fill')

    expect(fill.attributes('style')).toContain('width: 50%')
  })

  it('clamps width to 100% when value exceeds max', () => {
    const wrapper = mount(PortalAtomsProgressBar, {
      props: {
        value: 120,
        max: 100,
      },
    })

    const fill = wrapper.find('.bar-fill')

    expect(fill.attributes('style')).toContain('width: 100%')
  })

  it('handles 0 max gracefully without NaN', () => {
    const wrapper = mount(PortalAtomsProgressBar, {
      props: {
        value: 0,
        max: 0,
      },
    })

    const fill = wrapper.find('.bar-fill')

    expect(fill.attributes('style')).toContain('width: 0%')
  })

  it('sets custom bar color variable', () => {
    const wrapper = mount(PortalAtomsProgressBar, {
      props: {
        value: 30,
        max: 100,
        color: 'var(--color-status-danger)',
      },
    })

    expect(wrapper.attributes('style')).toContain('--bar-color: var(--color-status-danger)')
  })
})
