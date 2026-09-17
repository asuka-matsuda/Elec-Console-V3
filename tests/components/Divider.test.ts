import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Divider from '../../app/components/common/atoms/Divider.vue'

describe('Divider.vue', () => {
  it('renders an <hr> element with default classes and CSS variables', () => {
    const wrapper = mount(Divider)

    const hr = wrapper.find('hr')

    expect(hr.exists()).toBe(true)
    expect(hr.classes()).toContain('divider')
    expect(hr.classes()).toContain('relative')
    expect(hr.classes()).toContain('shrink-0')
    expect(hr.classes()).toContain('overflow-hidden')
    expect(hr.classes()).toContain('w-full')
    expect(hr.classes()).toContain('h-px')
    expect(hr.classes()).toContain('is-solid')
    expect(hr.classes()).toContain('is-horizontal')
    expect(hr.classes()).toContain('is-animated')
    expect(hr.attributes('style')).toContain('--divider-color: var(--theme-accent)')
  })

  it('applies tailwind layout classes correctly based on orientation', () => {
    const wrapperH = mount(Divider, {
      props: {
        orientation: 'horizontal',
      },
    })

    expect(wrapperH.classes()).toContain('w-full')
    expect(wrapperH.classes()).toContain('h-px')
    expect(wrapperH.classes()).not.toContain('w-px')

    const wrapperV = mount(Divider, {
      props: {
        orientation: 'vertical',
      },
    })

    expect(wrapperV.classes()).toContain('w-px')
    expect(wrapperV.classes()).toContain('h-full')
    expect(wrapperV.classes()).toContain('min-h-[1em]')
    expect(wrapperV.classes()).toContain('self-stretch')
    expect(wrapperV.classes()).not.toContain('w-full')
  })

  it('applies custom type class (fade-center and fade-side)', () => {
    const wrapperCenter = mount(Divider, {
      props: {
        type: 'fade-center',
      },
    })

    expect(wrapperCenter.classes()).toContain('is-fade-center')
    expect(wrapperCenter.classes()).not.toContain('is-solid')

    const wrapperSide = mount(Divider, {
      props: {
        type: 'fade-side',
      },
    })

    expect(wrapperSide.classes()).toContain('is-fade-side')
  })

  it('supports vertical orientation as a static divider without animation even if animated is true', () => {
    const wrapperDefault = mount(Divider, {
      props: {
        orientation: 'vertical',
      },
    })

    expect(wrapperDefault.classes()).toContain('is-vertical')
    expect(wrapperDefault.classes()).not.toContain('is-horizontal')
    expect(wrapperDefault.classes()).not.toContain('is-animated')

    const wrapperExplicit = mount(Divider, {
      props: {
        orientation: 'vertical',
        animated: true,
      },
    })

    expect(wrapperExplicit.classes()).not.toContain('is-animated')
  })

  it('applies custom color to --divider-color', () => {
    const wrapper = mount(Divider, {
      props: {
        color: '#00ffcc',
      },
    })

    expect(wrapper.attributes('style')).toContain('--divider-color: #00ffcc')
  })

  it('omits is-animated class when animated prop is false', () => {
    const wrapper = mount(Divider, {
      props: {
        animated: false,
      },
    })

    expect(wrapper.classes()).not.toContain('is-animated')
  })

  it('preserves user-provided classes via fallthrough attributes', () => {
    const wrapper = mount(Divider, {
      attrs: {
        class: 'my-6 custom-divider-class',
      },
    })

    expect(wrapper.classes()).toContain('my-6')
    expect(wrapper.classes()).toContain('custom-divider-class')
    expect(wrapper.classes()).toContain('divider')
  })
})
