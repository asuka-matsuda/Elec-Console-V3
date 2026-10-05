import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ClearableInput from '../../app/components/common/atoms/ClearableInput.vue'

describe('ClearableInput.vue', () => {
  it('does not render clear button when modelValue is empty', () => {
    const wrapper = mount(ClearableInput, {
      props: {
        modelValue: '',
      },
      global: {
        stubs: {
          Icon: true,
        },
      },
    })

    expect(wrapper.find('.clear-btn').exists()).toBe(false)
  })

  it('renders clear button when modelValue has text', () => {
    const wrapper = mount(ClearableInput, {
      props: {
        modelValue: '検索キーワード',
      },
      global: {
        stubs: {
          Icon: true,
        },
      },
    })

    expect(wrapper.find('.clear-btn').exists()).toBe(true)
  })

  it('clears modelValue and emits clear event when clear button is clicked', async () => {
    const wrapper = mount(ClearableInput, {
      props: {
        'modelValue': '消去対象テキスト',
        'onUpdate:modelValue': (val: string | number | null) => wrapper.setProps({ modelValue: val }),
      },
      global: {
        stubs: {
          Icon: true,
        },
      },
    })

    const clearBtn = wrapper.find('.clear-btn')

    expect(clearBtn.exists()).toBe(true)

    await clearBtn.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
    expect(wrapper.emitted('clear')).toBeTruthy()
  })

  it('hides clear button when input is disabled or readonly', () => {
    const disabledWrapper = mount(ClearableInput, {
      props: {
        modelValue: 'テキスト',
        disabled: true,
      },
      global: { stubs: { Icon: true } },
    })

    expect(disabledWrapper.find('.clear-btn').exists()).toBe(false)

    const readonlyWrapper = mount(ClearableInput, {
      props: {
        modelValue: 'テキスト',
        readonly: true,
      },
      global: { stubs: { Icon: true } },
    })

    expect(readonlyWrapper.find('.clear-btn').exists()).toBe(false)
  })
})
