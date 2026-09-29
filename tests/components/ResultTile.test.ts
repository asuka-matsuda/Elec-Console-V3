import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ResultTile from '../../app/components/common/molecules/ResultTile.vue'

describe('ResultTile.vue', () => {
  const commonStubs = {
    Badge: {
      props: ['color'],
      template: '<span class="badge-stub"><slot /></span>',
    },
  }

  it('renders title, badge, and slot value correctly', () => {
    const wrapper = mount(ResultTile, {
      props: {
        title: '選定サイズ',
        badge: '適合',
        status: 'success',
      },
      slots: {
        default: '5.5 mm²',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('選定サイズ')
    expect(wrapper.text()).toContain('適合')
    expect(wrapper.text()).toContain('5.5 mm²')
    expect(wrapper.find('output').classes()).toContain('is-success')
  })

  it('handles isEmpty prop correctly', () => {
    const wrapper = mount(ResultTile, {
      props: {
        title: '測定値',
        isEmpty: true,
      },
      slots: {
        default: '-',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('output').classes()).toContain('is-empty')
  })
})
