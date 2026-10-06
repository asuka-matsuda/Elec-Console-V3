import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Toggle from '../../app/components/common/atoms/Toggle.vue'

describe('Toggle', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(Toggle, {
      props: {
        modelValue: false,
        label: '自動保存',
      },
    })

    const input = wrapper.find('input[type="checkbox"]')

    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.classes()).toContain('toggle--md')
    expect(wrapper.classes()).toContain('toggle--default')
    expect(wrapper.classes()).not.toContain('is-active')
    expect(wrapper.text()).toContain('自動保存')
  })

  it('updates modelValue and emits change when toggled', async () => {
    const wrapper = mount(Toggle, {
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
    const wrapper = mount(Toggle, {
      props: {
        modelValue: false,
        disabled: true,
      },
    })

    const input = wrapper.find('input[type="checkbox"]')

    expect((input.element as HTMLInputElement).disabled).toBe(true)
    expect(wrapper.classes()).toContain('is-disabled')
  })

  it('handles loading state correctly', () => {
    const wrapper = mount(Toggle, {
      props: {
        modelValue: false,
        loading: true,
      },
    })

    const input = wrapper.find('input[type="checkbox"]')

    expect((input.element as HTMLInputElement).disabled).toBe(true)
    expect(wrapper.classes()).toContain('is-loading')
    expect(wrapper.find('.toggle-icon').exists()).toBe(true)
  })

  it('renders description correctly', () => {
    const wrapper = mount(Toggle, {
      props: {
        modelValue: false,
        label: '二要素認証',
        description: 'ログイン時に認証コードの入力を要求します。',
      },
    })

    expect(wrapper.find('.toggle-description').text()).toBe('ログイン時に認証コードの入力を要求します。')
  })

  it('applies custom size and color classes', () => {
    const wrapper = mount(Toggle, {
      props: {
        modelValue: true,
        size: 'lg',
        color: 'green',
      },
    })

    expect(wrapper.classes()).toContain('toggle--lg')
    expect(wrapper.classes()).toContain('toggle--green')
  })

  it('renders custom icons when provided', () => {
    const wrapper = mount(Toggle, {
      props: {
        modelValue: true,
        iconChecked: 'check',
        iconUnchecked: 'x',
      },
    })

    expect(wrapper.find('.toggle-icon').exists()).toBe(true)
  })
})
