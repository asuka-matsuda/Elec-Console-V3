import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Switch from '../../app/components/common/atoms/Switch.vue'

describe('Switch', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(Switch, {
      props: {
        modelValue: false,
        label: '自動保存を有効にする',
      },
    })

    const input = wrapper.find('input[type="checkbox"]')

    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.classes()).not.toContain('is-active')
    expect(wrapper.text()).toContain('自動保存を有効にする')
  })

  it('updates modelValue and emits change when toggled', async () => {
    const wrapper = mount(Switch, {
      props: {
        'modelValue': false,
        'onUpdate:modelValue': (val: boolean) => wrapper.setProps({ modelValue: val }),
      },
    })

    const input = wrapper.find('input[type="checkbox"]')

    await input.setValue(true)

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.classes()).toContain('is-active')
  })

  it('disables input when disabled prop is true', () => {
    const wrapper = mount(Switch, {
      props: {
        modelValue: false,
        disabled: true,
      },
    })

    const input = wrapper.find('input[type="checkbox"]')

    expect(input.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('is-disabled')
  })

  it('disables input and shows loading spinner when loading prop is true', () => {
    const wrapper = mount(Switch, {
      props: {
        modelValue: true,
        loading: true,
      },
    })

    const input = wrapper.find('input[type="checkbox"]')

    expect(input.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('is-loading')
    expect(wrapper.find('.switch-loader').exists()).toBe(true)
  })
})
