import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Icon from '../../app/components/common/atoms/Icon.vue'

describe('Icon.vue', () => {
  it('renders registered icon component correctly', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'check',
      },
    })

    const svg = wrapper.find('svg')

    expect(svg.exists()).toBe(true)
    expect(svg.classes()).toContain('app-icon')
    expect(svg.classes()).toContain('inline-block')
    expect(svg.classes()).toContain('shrink-0')
  })

  it('applies size class when size prop is provided', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'check',
        size: 'sm',
      },
    })

    const svg = wrapper.find('svg')

    expect(svg.classes()).toContain('is-sm')
  })

  it('applies u-spin class when spin prop is true', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'loader',
        spin: true,
      },
    })

    const svg = wrapper.find('svg')

    expect(svg.classes()).toContain('u-spin')
  })

  it('does not render when icon name is unregistered', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'non-existent-icon' as unknown as import('~/constants/icons').IconName,
      },
    })

    expect(wrapper.find('svg').exists()).toBe(false)
  })
})
