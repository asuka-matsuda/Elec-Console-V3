import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import FormControlAction from '../../app/components/common/atoms/FormControlAction.vue'

describe('FormControlAction.vue', () => {
  it('renders icon with default classes', () => {
    const wrapper = mount(FormControlAction, {
      props: {
        icon: 'x',
      },
    })

    expect(wrapper.find('span.form-control-action').exists()).toBe(true)
    const icon = wrapper.findComponent({ name: 'Icon' })

    expect(icon.exists()).toBe(true)
    expect(icon.props('name')).toBe('x')
  })

  it('sets title attribute when provided', () => {
    const wrapper = mount(FormControlAction, {
      props: {
        icon: 'x',
        title: 'クリア',
      },
    })

    expect(wrapper.attributes('title')).toBe('クリア')
  })

  it('emits click event on click', async () => {
    const wrapper = mount(FormControlAction, {
      props: {
        icon: 'x',
      },
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('does not emit click event when disabled', async () => {
    const wrapper = mount(FormControlAction, {
      props: {
        icon: 'x',
        disabled: true,
      },
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toBeFalsy()
    expect(wrapper.classes()).toContain('is-disabled')
  })

  it('does not emit click event when interactive is false', async () => {
    const wrapper = mount(FormControlAction, {
      props: {
        icon: 'chevron-down',
        interactive: false,
      },
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toBeFalsy()
    expect(wrapper.classes()).toContain('is-non-interactive')
  })

  it('applies rotate class when rotate is true', () => {
    const wrapper = mount(FormControlAction, {
      props: {
        icon: 'chevron-down',
        rotate: true,
      },
    })

    expect(wrapper.classes()).toContain('is-rotated')
  })
})
