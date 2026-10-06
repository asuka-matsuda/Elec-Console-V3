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

  it('renders Geist sizes properly (sm, md, lg)', () => {
    const sizes = ['sm', 'md', 'lg'] as const

    for (const size of sizes) {
      const wrapper = mount(Input, {
        props: { size },
      })

      expect(wrapper.classes()).toContain(`input--${size}`)
    }
  })

  it('renders prefix and suffix text and icons properly', () => {
    const wrapper = mount(Input, {
      props: {
        icon: 'search',
        prefix: 'https://',
        suffix: '.com',
        suffixIcon: 'check',
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

    expect(wrapper.find('.input-prefix').text()).toContain('https://')
    expect(wrapper.find('.input-suffix').text()).toContain('.com')

    const icons = wrapper.findAll('.icon')

    expect(icons.length).toBe(2)
    expect(icons[0].attributes('data-icon')).toBe('search')
    expect(icons[1].attributes('data-icon')).toBe('check')
  })

  it('trims whitespace on blur when trim prop is true', async () => {
    const wrapper = mount(Input, {
      props: {
        'modelValue': '  test-value   ',
        'trim': true,
        'onUpdate:modelValue': (val: string | number | null) => wrapper.setProps({ modelValue: val }),
      },
    })

    const input = wrapper.find('input')

    await input.trigger('blur')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['  test-value'])
  })

  it('handles clearable prop and clears input value on clear button click', async () => {
    // 1. clearable が false の時は文字があってもクリアボタンを表示しない
    const nonClearableWrapper = mount(Input, {
      props: {
        modelValue: 'テキスト',
        clearable: false,
      },
      global: { stubs: { Icon: true } },
    })

    expect(nonClearableWrapper.find('.clear-btn').exists()).toBe(false)

    // 2. clearable が true でも空文字ならクリアボタンを表示しない
    const emptyWrapper = mount(Input, {
      props: {
        modelValue: '',
        clearable: true,
      },
      global: { stubs: { Icon: true } },
    })

    expect(emptyWrapper.find('.clear-btn').exists()).toBe(false)

    // 3. clearable が true で値がある時はクリアボタンを表示し、クリックでクリア
    const clearableWrapper = mount(Input, {
      props: {
        'modelValue': '消去対象テキスト',
        'clearable': true,
        'onUpdate:modelValue': (val: string | number | null) => clearableWrapper.setProps({ modelValue: val }),
      },
      global: { stubs: { Icon: true } },
    })

    const clearBtn = clearableWrapper.find('.clear-btn')

    expect(clearBtn.exists()).toBe(true)

    await clearBtn.trigger('click')

    expect(clearableWrapper.emitted('update:modelValue')?.[0]).toEqual([''])
    expect(clearableWrapper.emitted('clear')).toBeTruthy()

    // 4. disabled または readonly 時はクリアボタンを非表示
    const disabledWrapper = mount(Input, {
      props: {
        modelValue: 'テキスト',
        clearable: true,
        disabled: true,
      },
      global: { stubs: { Icon: true } },
    })

    expect(disabledWrapper.find('.clear-btn').exists()).toBe(false)

    const readonlyWrapper = mount(Input, {
      props: {
        modelValue: 'テキスト',
        clearable: true,
        readonly: true,
      },
      global: { stubs: { Icon: true } },
    })

    expect(readonlyWrapper.find('.clear-btn').exists()).toBe(false)
  })
})
