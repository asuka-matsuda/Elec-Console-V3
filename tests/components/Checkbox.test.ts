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

  it('disables input and applies disabled class when disabled prop is true', () => {
    const wrapper = mount(Checkbox, {
      props: {
        modelValue: true,
        disabled: true,
      },
    })

    const input = wrapper.find('input[type="checkbox"]')

    expect(input.attributes('disabled')).toBeDefined()
    expect((input.element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.classes()).toContain('is-disabled')
  })

  it('supports indeterminate state and displays minus icon', () => {
    const wrapper = mount(Checkbox, {
      props: {
        modelValue: false,
        indeterminate: true,
      },
      global: {
        stubs: {
          Icon: {
            props: ['name'],
            template: '<span class="icon" :data-icon="name" />',
          },
        },
      },
    })

    expect(wrapper.classes()).toContain('is-indeterminate')

    const icon = wrapper.find('.icon')

    expect(icon.attributes('data-icon')).toBe('minus')

    const input = wrapper.find('input[type="checkbox"]')

    expect((input.element as HTMLInputElement).indeterminate).toBe(true)
  })

  it('supports custom color prop and overrides checked background variable', () => {
    const wrapper = mount(Checkbox, {
      props: {
        modelValue: false,
        color: 'var(--color-category-red)',
      },
    })

    expect(wrapper.attributes('style')).toContain('--control-checked-bg: var(--color-category-red)')
  })

  it('inherits class and style on root label element via standard fallthrough', () => {
    const wrapper = mount(Checkbox, {
      props: {
        modelValue: false,
      },
      attrs: {
        class: 'custom-class',
      },
    })

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
