import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CellPhaseMeas from '../../../app/components/portal/exam/CellPhaseMeas.vue'

describe('CellPhaseMeas.vue', () => {
  it('renders label and formatted value in display mode', () => {
    const wrapper = mount(CellPhaseMeas, {
      props: {
        label: 'R - S',
        val: 200.5,
        unit: 'V',
        status: 'OK',
      },
    })

    expect(wrapper.text()).toContain('R - S')
    expect(wrapper.text()).toContain('200.5')
    expect(wrapper.text()).toContain('V')
    expect(wrapper.text()).toContain('OK')
  })

  it('formats MΩ values properly', () => {
    const wrapper = mount(CellPhaseMeas, {
      props: {
        label: 'R - N',
        val: 100,
        unit: 'MΩ',
      },
    })

    expect(wrapper.text()).toContain('100')
  })

  it('renders input in editing mode and emits updates', async () => {
    const wrapper = mount(CellPhaseMeas, {
      props: {
        'label': 'R - S',
        'isEditing': true,
        'modelValue': '200',
        'onUpdate:modelValue': (e: string | number) => wrapper.setProps({ modelValue: e }),
      },
      global: {
        stubs: {
          Input: {
            props: ['modelValue'],
            emits: ['update:modelValue', 'keydown'],
            template: '<input class="input-stub" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @keydown.enter.prevent="$emit(\'enter\')" />',
          },
        },
      },
    })

    const input = wrapper.find('.input-stub')

    expect(input.exists()).toBe(true)
    await input.setValue('210')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })
  it('配電方式に応じた基準値未満の入力で「基準値未満です」の警告が表示されること', async () => {
    // 400V回路 (基準値: 0.4MΩ)
    const wrapper400 = mount(CellPhaseMeas, {
      props: {
        label: 'R - S',
        isEditing: true,
        modelValue: '0.3',
        unit: 'MΩ',
        haidenHoushiki: '3φ3W 400V',
      },
      global: {
        stubs: {
          Input: {
            props: ['modelValue', 'error'],
            template: '<input class="input-stub" :value="modelValue" :data-error="error" />',
          },
        },
      },
    })

    expect(wrapper400.find('.cell-warning-sub').exists()).toBe(true)
    expect(wrapper400.find('.cell-warning-sub').text()).toBe('基準値未満です')
    expect(wrapper400.find('.input-stub').attributes('data-error')).toBe('true')

    // 0.4MΩ入力時 -> 警告が消えること
    await wrapper400.setProps({ modelValue: '0.4' })
    expect(wrapper400.find('.cell-warning-sub').exists()).toBe(false)
    expect(wrapper400.find('.input-stub').attributes('data-error')).toBe('false')

    // 200V回路 (基準値: 0.2MΩ)
    const wrapper200 = mount(CellPhaseMeas, {
      props: {
        label: 'R - S',
        isEditing: true,
        modelValue: '0.15',
        unit: 'MΩ',
        haidenHoushiki: '3φ3W 200V',
      },
      global: {
        stubs: {
          Input: {
            props: ['modelValue', 'error'],
            template: '<input class="input-stub" :value="modelValue" :data-error="error" />',
          },
        },
      },
    })

    expect(wrapper200.find('.cell-warning-sub').exists()).toBe(true)
    await wrapper200.setProps({ modelValue: '0.2' })
    expect(wrapper200.find('.cell-warning-sub').exists()).toBe(false)

    // 100/200V単相3線回路 (基準値: 0.1MΩ)
    const wrapper100 = mount(CellPhaseMeas, {
      props: {
        label: 'R - N',
        isEditing: true,
        modelValue: '0.05',
        unit: 'MΩ',
        haidenHoushiki: '1φ3W 100/200V',
      },
      global: {
        stubs: {
          Input: {
            props: ['modelValue', 'error'],
            template: '<input class="input-stub" :value="modelValue" :data-error="error" />',
          },
        },
      },
    })

    expect(wrapper100.find('.cell-warning-sub').exists()).toBe(true)
    await wrapper100.setProps({ modelValue: '0.1' })
    expect(wrapper100.find('.cell-warning-sub').exists()).toBe(false)
  })
})
