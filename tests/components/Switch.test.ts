import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Switch from '../../app/components/common/atoms/Switch.vue'

describe('Switch', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(Switch, {
      props: {
        modelValue: false,
        label: '自動保存',
      },
    })

    const input = wrapper.find('input[type="checkbox"]')

    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.classes()).toContain('switch--md')
    expect(wrapper.classes()).toContain('switch--default')
    expect(wrapper.classes()).not.toContain('is-active')
    expect(wrapper.text()).toContain('自動保存')
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

  it('applies sizes and colors correctly', () => {
    const wrapper = mount(Switch, {
      props: {
        modelValue: false,
        size: 'sm',
        color: 'amber',
      },
    })

    expect(wrapper.classes()).toContain('switch--sm')
    expect(wrapper.classes()).toContain('switch--amber')
  })

  it('renders description when provided', () => {
    const wrapper = mount(Switch, {
      props: {
        modelValue: false,
        label: '二要素認証',
        description: 'ログイン時に認証アプリのワンタイムコードを要求します。',
      },
    })

    expect(wrapper.find('.switch-label').text()).toBe('二要素認証')
    expect(wrapper.find('.switch-description').text()).toBe('ログイン時に認証アプリのワンタイムコードを要求します。')
  })

  it('renders custom icons for checked and unchecked states', () => {
    const wrapperOff = mount(Switch, {
      props: {
        modelValue: false,
        iconChecked: 'check',
        iconUnchecked: 'x',
      },
    })

    expect(wrapperOff.findComponent({ name: 'Icon' }).props('name')).toBe('x')

    const wrapperOn = mount(Switch, {
      props: {
        modelValue: true,
        iconChecked: 'check',
        iconUnchecked: 'x',
      },
    })

    expect(wrapperOn.findComponent({ name: 'Icon' }).props('name')).toBe('check')
  })
})
