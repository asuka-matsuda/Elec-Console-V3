import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Skeleton from '../../app/components/common/atoms/Skeleton.vue'

describe('Skeleton', () => {
  it('renders correctly with default props as span', () => {
    const wrapper = mount(Skeleton)

    expect(wrapper.element.tagName.toLowerCase()).toBe('span')
    expect(wrapper.classes()).toContain('skeleton')
    expect(wrapper.classes()).not.toContain('is-circle')
  })

  it('renders as custom element tag when as prop is provided', () => {
    const wrapper = mount(Skeleton, {
      props: {
        as: 'div',
      },
    })

    expect(wrapper.element.tagName.toLowerCase()).toBe('div')
  })

  it('applies custom width and height styles', () => {
    const wrapper = mount(Skeleton, {
      props: {
        width: '180px',
        height: '24px',
      },
    })

    const element = wrapper.element as HTMLElement

    expect(element.style.width).toBe('180px')
    expect(element.style.height).toBe('24px')
  })

  it('applies circle styling and equal dimensions when circle is true', () => {
    const wrapper = mount(Skeleton, {
      props: {
        circle: true,
        width: '48px',
      },
    })

    expect(wrapper.classes()).toContain('is-circle')
    const element = wrapper.element as HTMLElement

    expect(element.style.width).toBe('48px')
    expect(element.style.height).toBe('48px')
  })
})
