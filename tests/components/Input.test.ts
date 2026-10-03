import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Input from '../../app/components/common/atoms/Input.vue'

describe('Input.vue', () => {
  it('renders input with default props', () => {
    const wrapper = mount(Input, {
      props: {
        modelValue: 'テスト',
      },
    })

    const input = wrapper.find('input')

    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('テスト')
    expect(input.attributes('type')).toBe('text')
    expect(input.classes()).toContain('form-control')
  })

  it('updates modelValue on input event', async () => {
    const wrapper = mount(Input, {
      props: {
        'modelValue': '',
        'onUpdate:modelValue': (val: string | number | null) => wrapper.setProps({ modelValue: val }),
      },
    })

    const input = wrapper.find('input')

    await input.setValue('入力文字')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['入力文字'])
  })

  it('correctly applies native attributes like placeholder, disabled, and maxlength', () => {
    const wrapper = mount(Input, {
      attrs: {
        placeholder: '検索キーワード',
        disabled: true,
        maxlength: 50,
      },
    })

    const input = wrapper.find('input')

    expect(input.attributes('placeholder')).toBe('検索キーワード')
    expect(input.attributes('disabled')).toBeDefined()
    expect(input.attributes('maxlength')).toBe('50')
    expect(input.classes()).toContain('is-disabled')
  })

  it('correctly applies id and error props', () => {
    const wrapper = mount(Input, {
      props: {
        id: 'custom-input-id',
        error: true,
      },
    })

    const input = wrapper.find('input')

    expect(input.attributes('id')).toBe('custom-input-id')
    expect(input.classes()).toContain('is-error')
  })

  it('exposes DOM focus, blur, and select methods', () => {
    const wrapper = mount(Input)

    expect(typeof wrapper.vm.focus).toBe('function')
    expect(typeof wrapper.vm.blur).toBe('function')
    expect(typeof wrapper.vm.select).toBe('function')
    expect(wrapper.vm.inputRef).toBeDefined()
  })
})
