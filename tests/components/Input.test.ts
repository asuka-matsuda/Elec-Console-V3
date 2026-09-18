import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

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

  it('emits enter event on enter keydown', async () => {
    const wrapper = mount(Input, {
      props: { modelValue: '検索語' },
    })

    const input = wrapper.find('input')

    await input.trigger('keydown.enter')

    expect(wrapper.emitted('enter')).toBeTruthy()
  })

  it('blurs on wheel event when type is number', async () => {
    const wrapper = mount(Input, {
      props: { type: 'number', modelValue: 42 },
    })

    const input = wrapper.find('input')
    const blurSpy = vi.spyOn(input.element as HTMLInputElement, 'blur')

    await input.trigger('wheel')

    expect(blurSpy).toHaveBeenCalled()
  })

  it('shows clear button by default when input has value and clears it on click', async () => {
    const wrapper = mount(Input, {
      props: {
        'modelValue': '消去対象テキスト',
        'onUpdate:modelValue': (val: string | number | null) => wrapper.setProps({ modelValue: val }),
      },
    })

    const clearButton = wrapper.find('[title="クリア"]')

    expect(clearButton.exists()).toBe(true)

    await clearButton.trigger('click')

    expect(wrapper.emitted('clear')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
  })

  it('hides clear button when clearable is explicitly false', () => {
    const wrapper = mount(Input, {
      props: {
        clearable: false,
        modelValue: 'テストテキスト',
      },
    })

    const clearButton = wrapper.find('[title="クリア"]')

    expect(clearButton.exists()).toBe(false)
  })

  it('toggles password visibility with passwordToggle button', async () => {
    const wrapper = mount(Input, {
      props: {
        type: 'password',
        modelValue: 'secret123',
        passwordToggle: true,
      },
    })

    const input = wrapper.find('input')
    const toggleButton = wrapper.find('[title="パスワードを表示"]')

    expect(input.attributes('type')).toBe('password')
    expect(toggleButton.exists()).toBe(true)

    // クリックで表示（text）に切り替え
    await toggleButton.trigger('click')
    expect(input.attributes('type')).toBe('text')

    // もう一度クリックで非表示（password）に戻る
    await toggleButton.trigger('click')
    expect(input.attributes('type')).toBe('password')
  })

  it('renders addon unit text when addon prop is provided', () => {
    const wrapper = mount(Input, {
      props: {
        modelValue: 120,
        addon: 'mm',
      },
    })

    const addon = wrapper.find('.input-addon')

    expect(addon.exists()).toBe(true)
    expect(addon.text()).toBe('mm')
    expect(wrapper.find('.input-container').classes()).toContain('has-addon')
  })

  it('renders addon slot when slot is provided', () => {
    const wrapper = mount(Input, {
      props: {
        modelValue: 50,
      },
      slots: {
        addon: '<span class="custom-unit-select">A</span>',
      },
    })

    const slotEl = wrapper.find('.custom-unit-select')

    expect(slotEl.exists()).toBe(true)
    expect(slotEl.text()).toBe('A')
    expect(wrapper.find('.input-container').classes()).toContain('has-addon')
  })
})
