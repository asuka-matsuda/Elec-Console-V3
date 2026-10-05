import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Badge from '../../app/components/common/atoms/Badge.vue'

describe('Badge.vue', () => {
  it('renders default badge with badge--gray and badge--md', () => {
    const wrapper = mount(Badge, {
      slots: {
        default: '通常バッジ',
      },
      global: {
        stubs: {
          Icon: true,
        },
      },
    })

    expect(wrapper.element.tagName.toLowerCase()).toBe('span')
    expect(wrapper.classes()).toContain('badge')
    expect(wrapper.classes()).toContain('badge--gray')
    expect(wrapper.classes()).toContain('badge--md')
    expect(wrapper.text()).toBe('通常バッジ')
  })

  it('normalizes semantic aliases to Geist color variants', () => {
    const variants = [
      { input: 'primary', expected: 'badge--blue' },
      { input: 'success', expected: 'badge--green' },
      { input: 'warning', expected: 'badge--amber' },
      { input: 'danger', expected: 'badge--red' },
      { input: 'accent', expected: 'badge--purple' },
      { input: 'neutral', expected: 'badge--gray' },
      { input: 'default', expected: 'badge--gray' },
    ] as const

    for (const { input, expected } of variants) {
      const wrapper = mount(Badge, {
        props: { variant: input },
        global: { stubs: { Icon: true } },
      })

      expect(wrapper.classes()).toContain(expected)
    }
  })

  it('supports direct Geist color variants', () => {
    const geistColors = ['gray', 'blue', 'purple', 'amber', 'red', 'pink', 'green', 'teal', 'inverted'] as const

    for (const color of geistColors) {
      const wrapper = mount(Badge, {
        props: { variant: color },
        global: { stubs: { Icon: true } },
      })

      expect(wrapper.classes()).toContain(`badge--${color}`)
    }
  })

  it('applies subtle modifier when contrast="low"', () => {
    const wrapper = mount(Badge, {
      props: { contrast: 'low' },
      global: { stubs: { Icon: true } },
    })

    expect(wrapper.classes()).toContain('is-subtle')
  })

  it('applies sizes correctly', () => {
    const smWrapper = mount(Badge, {
      props: { size: 'sm' },
      global: { stubs: { Icon: true } },
    })

    expect(smWrapper.classes()).toContain('badge--sm')

    const lgWrapper = mount(Badge, {
      props: { size: 'lg' },
      global: { stubs: { Icon: true } },
    })

    expect(lgWrapper.classes()).toContain('badge--lg')
  })

  it('renders leading icon when provided', () => {
    const wrapper = mount(Badge, {
      props: { icon: 'check' },
      global: {
        stubs: {
          Icon: {
            template: '<i class="mock-icon" :data-name="$attrs.name" />',
          },
        },
      },
    })

    const icon = wrapper.find('.badge-icon')

    expect(icon.exists()).toBe(true)
  })
})
