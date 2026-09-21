import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PhaseMeasCell from '../../../app/components/portal/molecules/PhaseMeasCell.vue'

describe('PhaseMeasCell.vue', () => {
  it('renders label and formatted value in display mode', () => {
    const wrapper = mount(PhaseMeasCell, {
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
    const wrapper = mount(PhaseMeasCell, {
      props: {
        label: 'R - N',
        val: 100,
        unit: 'MΩ',
      },
    })

    expect(wrapper.text()).toContain('100')
  })

  it('renders input in editing mode and emits updates', async () => {
    const wrapper = mount(PhaseMeasCell, {
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
})
