import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PortalAtomsCircularGauge from '../../../app/components/portal/AtomsCircularGauge.vue'

describe('PortalAtomsCircularGauge.vue', () => {
  it('renders percentage and label correctly', () => {
    const wrapper = mount(PortalAtomsCircularGauge, {
      props: {
        value: 75,
        label: '幹線 全体',
      },
    })

    expect(wrapper.text()).toContain('75')
    expect(wrapper.text()).toContain('%')
    expect(wrapper.text()).toContain('幹線 全体')
  })

  it('clamps value between 0 and 100', () => {
    const wrapperOver = mount(PortalAtomsCircularGauge, {
      props: {
        value: 150,
      },
    })

    expect(wrapperOver.text()).toContain('100')

    const wrapperUnder = mount(PortalAtomsCircularGauge, {
      props: {
        value: -20,
      },
    })

    expect(wrapperUnder.text()).toContain('0')
  })

  it('applies size class correctly', () => {
    const wrapperSm = mount(PortalAtomsCircularGauge, {
      props: {
        size: 'sm',
      },
    })

    expect(wrapperSm.classes()).toContain('is-sm')

    const wrapperLg = mount(PortalAtomsCircularGauge, {
      props: {
        size: 'lg',
      },
    })

    expect(wrapperLg.classes()).toContain('is-lg')
  })
})
