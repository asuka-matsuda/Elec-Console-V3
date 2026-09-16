import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Checkbox from '../../app/components/common/atoms/Checkbox.vue'

describe('Checkbox', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(Checkbox, {
      props: {
        modelValue: false,
        label: '利用規約に同意する',
      },
    })

    const input = wrapper.find('input[type="checkbox"]')

    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.text()).toContain('利用規約に同意する')
  })

  it('updates boolean modelValue when input is toggled', async () => {
    const wrapper = mount(Checkbox, {
      props: {
        'modelValue': false,
        'onUpdate:modelValue': (val: boolean) => wrapper.setProps({ modelValue: val }),
      },
    })

    const input = wrapper.find('input[type="checkbox"]')

    await input.setValue(true)

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('handles array modelValue for multiple checkboxes', async () => {
    const wrapper = mount(Checkbox, {
      props: {
        'modelValue': ['site-a'],
        'value': 'site-b',
        'onUpdate:modelValue': (val: string[]) => wrapper.setProps({ modelValue: val }),
      },
    })

    const input = wrapper.find('input[type="checkbox"]')

    await input.setValue(true)

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['site-a', 'site-b']])
  })

  it('supports custom true-value and false-value', async () => {
    const wrapper = mount(Checkbox, {
      props: {
        'modelValue': 'N',
        'trueValue': 'Y',
        'falseValue': 'N',
        'onUpdate:modelValue': (val: string) => wrapper.setProps({ modelValue: val }),
      },
    })

    const input = wrapper.find('input[type="checkbox"]')

    expect((input.element as HTMLInputElement).checked).toBe(false)

    await input.setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Y'])
  })

  it('reflects indeterminate state in property and class', () => {
    const wrapper = mount(Checkbox, {
      props: {
        modelValue: false,
        indeterminate: true,
      },
    })

    const input = wrapper.find('input[type="checkbox"]')

    expect((input.element as HTMLInputElement).indeterminate).toBe(true)
    expect(wrapper.classes()).toContain('is-indeterminate')
  })

  it('disables input and applies disabled class when disabled prop is true', () => {
    const wrapper = mount(Checkbox, {
      props: {
        modelValue: false,
        disabled: true,
      },
    })

    const input = wrapper.find('input[type="checkbox"]')

    expect(input.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('is-disabled')
  })

  it('delegates form attributes to input and merges class into root label', () => {
    const wrapper = mount(Checkbox, {
      props: {
        modelValue: false,
      },
      attrs: {
        'id': 'chk-agree',
        'name': 'agree-checkbox',
        'data-test': 'my-checkbox',
        'class': 'custom-class',
      },
    })

    const input = wrapper.find('input[type="checkbox"]')

    // inputにフォーム属性が渡っていること
    expect(input.attributes('id')).toBe('chk-agree')
    expect(input.attributes('name')).toBe('agree-checkbox')
    expect(input.attributes('data-test')).toBe('my-checkbox')

    // rootのlabelにはフォーム属性が付かず、classがマージされていること
    expect(wrapper.attributes('id')).toBeUndefined()
    expect(wrapper.attributes('name')).toBeUndefined()
    expect(wrapper.classes()).toContain('custom-class')
    expect(wrapper.classes()).toContain('checkbox')
  })

  it('renders slot content over label prop when provided', () => {
    const wrapper = mount(Checkbox, {
      props: {
        modelValue: false,
        label: 'デフォルトラベル',
      },
      slots: {
        default: 'カスタムスロットテキスト',
      },
    })

    expect(wrapper.text()).toContain('カスタムスロットテキスト')
    expect(wrapper.text()).not.toContain('デフォルトラベル')
  })
})
