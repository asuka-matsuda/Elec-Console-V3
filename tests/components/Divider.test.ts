import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Divider from '../../app/components/common/atoms/Divider.vue'

describe('Divider.vue', () => {
  it('renders correctly with default props (fade-side and horizontal)', () => {
    const wrapper = mount(Divider)

    const hr = wrapper.find('hr.divider')

    expect(hr.exists()).toBe(true)
    expect(hr.classes()).toContain('is-fade-side')
    expect(hr.classes()).toContain('is-horizontal')
    expect(hr.attributes('style')).toBeUndefined()
  })

  it('applies is-fade-center class when type is fade-center', () => {
    const wrapper = mount(Divider, {
      props: {
        type: 'fade-center',
      },
    })

    const hr = wrapper.find('hr.divider')

    expect(hr.classes()).toContain('is-fade-center')
    expect(hr.classes()).not.toContain('is-fade-side')
  })

  it('applies is-solid class when type is solid', () => {
    const wrapper = mount(Divider, {
      props: {
        type: 'solid',
      },
    })

    const hr = wrapper.find('hr.divider')

    expect(hr.classes()).toContain('is-solid')
  })

  it('applies is-vertical class when orientation is vertical', () => {
    const wrapper = mount(Divider, {
      props: {
        orientation: 'vertical',
      },
    })

    const hr = wrapper.find('hr.divider')

    expect(hr.classes()).toContain('is-vertical')
    expect(hr.classes()).toContain('is-solid')
    expect(hr.classes()).not.toContain('is-horizontal')
    expect(hr.classes()).not.toContain('is-fade-side')
  })

  it('applies --divider-custom-color when color prop is provided', () => {
    const wrapper = mount(Divider, {
      props: {
        color: '#ff5c5c',
      },
    })

    const hr = wrapper.find('hr.divider')

    expect(hr.attributes('style')).toContain('--divider-custom-color: #ff5c5c')
  })

  it('does not render unnecessary aria attributes or roles (clean markup)', () => {
    const wrapper = mount(Divider)

    const hr = wrapper.find('hr.divider')

    expect(hr.attributes('role')).toBeUndefined()
    expect(hr.attributes('aria-orientation')).toBeUndefined()
  })
})
