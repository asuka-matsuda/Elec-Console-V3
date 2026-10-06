import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Radio from '../../app/components/common/atoms/Radio.vue'

describe('Radio (Geist Radio Button)', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(Radio, {
      props: {
        modelValue: 'option2',
        value: 'option1',
        label: '幹線',
      },
    })

    const input = wrapper.find('input[type="radio"]')

    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.classes()).not.toContain('is-checked')
    expect(wrapper.text()).toContain('幹線')
  })

  it('renders as checked when modelValue equals value', () => {
    const wrapper = mount(Radio, {
      props: {
        modelValue: 'option1',
        value: 'option1',
        label: '幹線',
      },
    })

    const input = wrapper.find('input[type="radio"]')

    expect((input.element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.classes()).toContain('is-checked')
  })

  it('updates modelValue and emits change on change event', async () => {
    const wrapper = mount(Radio, {
      props: {
        'modelValue': 'option2',
        'value': 'option1',
        'onUpdate:modelValue': (val: unknown) => wrapper.setProps({ modelValue: val }),
      },
    })

    const input = wrapper.find('input[type="radio"]')

    await input.trigger('change')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['option1'])
    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')?.[0]).toEqual(['option1'])
  })

  it('disables input when disabled prop is true', async () => {
    const wrapper = mount(Radio, {
      props: {
        modelValue: 'option2',
        value: 'option1',
        disabled: true,
      },
    })

    const input = wrapper.find('input[type="radio"]')

    expect((input.element as HTMLInputElement).disabled).toBe(true)
    expect(wrapper.classes()).toContain('is-disabled')

    await input.trigger('change')

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('applies error class when error prop is true', () => {
    const wrapper = mount(Radio, {
      props: {
        modelValue: 'option2',
        value: 'option1',
        error: true,
      },
    })

    expect(wrapper.classes()).toContain('is-error')
  })

  it('applies custom color style when color prop is provided', () => {
    const wrapper = mount(Radio, {
      props: {
        modelValue: 'option1',
        value: 'option1',
        color: 'var(--color-status-success)',
      },
    })

    expect(wrapper.attributes('style')).toContain('--control-checked-bg: var(--color-status-success)')
  })

  it('renders default slot instead of label prop if provided', () => {
    const wrapper = mount(Radio, {
      props: {
        modelValue: 'option1',
        value: 'option1',
      },
      slots: {
        default: 'カスタムスロットラベル',
      },
    })

    expect(wrapper.find('.label').text()).toBe('カスタムスロットラベル')
  })
})
