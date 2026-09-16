import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Icon from '../../app/components/common/atoms/Icon.vue'

describe('Icon.vue', () => {
  it('renders an svg element with base classes', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'check',
      },
    })

    expect(wrapper.element.tagName.toLowerCase()).toBe('svg')
    expect(wrapper.classes()).toContain('app-icon')
    expect(wrapper.classes()).toContain('icon')
    expect(wrapper.classes()).toContain('inline-block')
    expect(wrapper.classes()).toContain('shrink-0')
    expect(wrapper.classes()).toContain('align-middle')
  })

  it('renders without size modifier class by default', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'bell',
      },
    })

    expect(wrapper.classes()).not.toContain('is-sm')
    expect(wrapper.classes()).not.toContain('is-md')
    expect(wrapper.classes()).not.toContain('is-lg')
    expect(wrapper.classes()).not.toContain('is-xl')
    expect(wrapper.classes()).not.toContain('is-xxl')
  })

  it.each(['sm', 'md', 'lg', 'xl', 'xxl'] as const)(
    'applies size modifier class for size="%s"',
    (size) => {
      const wrapper = mount(Icon, {
        props: {
          name: 'settings',
          size,
        },
      })

      expect(wrapper.classes()).toContain(`is-${size}`)
    },
  )

  it('applies default strokeWidth of 2', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'zap',
      },
    })

    const svg = wrapper.find('svg')

    expect(svg.attributes('stroke-width')).toBe('2')
  })

  it('passes custom strokeWidth to svg', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'zap',
        strokeWidth: 1.5,
      },
    })

    const svg = wrapper.find('svg')

    expect(svg.attributes('stroke-width')).toBe('1.5')
  })

  it('applies u-spin class when spin prop is true', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'loader',
        spin: true,
      },
    })

    expect(wrapper.classes()).toContain('u-spin')
  })

  it('does not apply u-spin class when spin prop is false or undefined', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'loader',
      },
    })

    expect(wrapper.classes()).not.toContain('u-spin')
  })
})
