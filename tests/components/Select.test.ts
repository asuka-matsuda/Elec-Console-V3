import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { computed } from 'vue'

import Select from '../../app/components/common/atoms/Select.vue'
import { FORM_GROUP_KEY, type SelectOption } from '../../app/types/components'

interface SelectVm {
  isOpen: boolean
  selectOption: (option: SelectOption) => void
}

const mockOptions = [
  { label: 'オプション1', value: 'opt1' },
  { label: 'オプション2', value: 'opt2' },
  { label: '無効オプション', value: 'opt3', disabled: true },
]

describe('Select.vue', () => {
  it('renders placeholder when no value is selected', () => {
    const wrapper = mount(Select, {
      props: {
        options: mockOptions,
        placeholder: '選択してください',
        modelValue: null,
      },
    })

    expect(wrapper.text()).toContain('選択してください')
  })

  it('renders selected option label when value is present', () => {
    const wrapper = mount(Select, {
      props: {
        options: mockOptions,
        modelValue: 'opt2',
      },
    })

    expect(wrapper.text()).toContain('オプション2')
  })

  it('does not show clear button by default', () => {
    const wrapper = mount(Select, {
      props: {
        options: mockOptions,
        modelValue: 'opt1',
      },
    })

    const clearButton = wrapper.find('[title="選択解除"]')

    expect(clearButton.exists()).toBe(false)
  })

  it('shows clear button when clearable is true and clears on click', async () => {
    const wrapper = mount(Select, {
      props: {
        'options': mockOptions,
        'modelValue': 'opt1',
        'clearable': true,
        'onUpdate:modelValue': (val: string | null) => wrapper.setProps({ modelValue: val }),
      },
    })

    const clearButton = wrapper.find('[title="選択解除"]')

    expect(clearButton.exists()).toBe(true)

    await clearButton.trigger('click')

    expect(wrapper.emitted('clear')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null])
  })

  it('does not show clear button when clearable is false', () => {
    const wrapper = mount(Select, {
      props: {
        options: mockOptions,
        modelValue: 'opt1',
        clearable: false,
      },
    })

    const clearButton = wrapper.find('[title="選択解除"]')

    expect(clearButton.exists()).toBe(false)
  })

  it('opens dropdown on button click and selects option', async () => {
    const wrapper = mount(Select, {
      props: {
        'options': mockOptions,
        'modelValue': null,
        'onUpdate:modelValue': (val: string | null) => wrapper.setProps({ modelValue: val }),
      },
    })

    const button = wrapper.find('button.custom-select__value')

    await button.trigger('click')

    const vm = wrapper.vm as unknown as SelectVm

    expect(vm.isOpen).toBe(true)

    vm.selectOption(mockOptions[1]!)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['opt2'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['opt2'])
    expect(vm.isOpen).toBe(false)
  })

  it('does not open dropdown when disabled', async () => {
    const wrapper = mount(Select, {
      props: {
        options: mockOptions,
        disabled: true,
      },
    })

    const button = wrapper.find('button.custom-select__value')

    await button.trigger('click')

    const vm = wrapper.vm as unknown as SelectVm

    expect(vm.isOpen).toBe(false)
  })

  it('inherits id and error from FORM_GROUP_KEY injection', () => {
    const wrapper = mount(Select, {
      props: {
        options: mockOptions,
      },
      global: {
        provide: {
          [FORM_GROUP_KEY as symbol]: {
            id: computed(() => 'form-group-field-id'),
            hasError: computed(() => true),
          },
        },
      },
    })

    const button = wrapper.find('button')

    expect(button.attributes('id')).toBe('form-group-field-id')
    expect(wrapper.classes()).toContain('is-error')
  })
})
