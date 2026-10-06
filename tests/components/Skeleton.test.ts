import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Skeleton from '../../app/components/common/atoms/Skeleton.vue'

describe('Skeleton', () => {
  it('renders correctly with default props as span', () => {
    const wrapper = mount(Skeleton)

    expect(wrapper.element.tagName.toLowerCase()).toBe('span')
    expect(wrapper.classes()).toContain('skeleton')
    expect(wrapper.classes()).toContain('skeleton--standalone')
    expect(wrapper.classes()).toContain('is-animated')
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

  it('applies custom width, height, and boxHeight styles with string and number', () => {
    const wrapper = mount(Skeleton, {
      props: {
        width: 160,
        height: 24,
        boxHeight: 48,
      },
    })

    const element = wrapper.element as HTMLElement

    expect(element.style.width).toBe('160px')
    expect(element.style.height).toBe('24px')
    expect(element.style.minHeight).toBe('48px')
  })

  it('applies circle styling and equal dimensions when circle or pill is true', () => {
    const wrapperCircle = mount(Skeleton, {
      props: {
        circle: true,
        width: '48px',
      },
    })

    expect(wrapperCircle.classes()).toContain('is-circle')
    const elementCircle = wrapperCircle.element as HTMLElement

    expect(elementCircle.style.width).toBe('48px')
    expect(elementCircle.style.height).toBe('48px')

    const wrapperPill = mount(Skeleton, {
      props: {
        pill: true,
        width: 32,
      },
    })

    expect(wrapperPill.classes()).toContain('is-circle')
    const elementPill = wrapperPill.element as HTMLElement

    expect(elementPill.style.width).toBe('32px')
    expect(elementPill.style.height).toBe('32px')
  })

  it('squared prop overrides circle or pill to keep straight corners', () => {
    const wrapper = mount(Skeleton, {
      props: {
        pill: true,
        squared: true,
        width: 40,
      },
    })

    expect(wrapper.classes()).not.toContain('is-circle')
  })

  it('disables animation class when animated is false', () => {
    const wrapper = mount(Skeleton, {
      props: {
        animated: false,
      },
    })

    expect(wrapper.classes()).not.toContain('is-animated')
  })

  it('applies button prop for border alignment', () => {
    const wrapper = mount(Skeleton, {
      props: {
        button: true,
      },
    })

    expect(wrapper.classes()).toContain('is-button')
  })

  it('wraps children properly when default slot is provided', () => {
    const wrapperLoading = mount(Skeleton, {
      props: {
        show: true,
      },
      slots: {
        default: '<button class="test-btn">Click me</button>',
      },
    })

    expect(wrapperLoading.classes()).toContain('skeleton--wrapper')
    expect(wrapperLoading.classes()).toContain('is-loading')
    expect(wrapperLoading.find('.skeleton-content').classes()).toContain('is-hidden')
    expect(wrapperLoading.find('.skeleton-overlay').exists()).toBe(true)
    expect(wrapperLoading.find('.test-btn').exists()).toBe(true)

    const wrapperLoaded = mount(Skeleton, {
      props: {
        show: false,
      },
      slots: {
        default: '<button class="test-btn">Click me</button>',
      },
    })

    expect(wrapperLoaded.classes()).toContain('skeleton--wrapper')
    expect(wrapperLoaded.classes()).not.toContain('is-loading')
    expect(wrapperLoaded.find('.skeleton-content').classes()).not.toContain('is-hidden')
    expect(wrapperLoaded.find('.skeleton-overlay').exists()).toBe(false)
  })
})
