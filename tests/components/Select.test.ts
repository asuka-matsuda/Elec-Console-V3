import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Select from '../../app/components/common/atoms/Select.vue'
import type { SelectOption } from '../../app/types/components'

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
    expect(vm.isOpen).toBe(false)
  })

  it('does not select disabled option', async () => {
    const wrapper = mount(Select, {
      props: {
        options: mockOptions,
        modelValue: null,
      },
    })

    const vm = wrapper.vm as unknown as SelectVm

    vm.selectOption(mockOptions[2]!) // disabled option

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
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

  it('correctly applies id and error props', () => {
    const wrapper = mount(Select, {
      props: {
        options: mockOptions,
        id: 'custom-select-id',
        error: true,
      },
    })

    const button = wrapper.find('button')

    expect(button.attributes('id')).toBe('custom-select-id')
    expect(wrapper.classes()).toContain('is-error')
  })

  it('renders Geist sizes properly (sm, md, lg)', () => {
    const sizes = ['sm', 'md', 'lg'] as const

    for (const size of sizes) {
      const wrapper = mount(Select, {
        props: {
          options: mockOptions,
          size,
        },
      })

      expect(wrapper.classes()).toContain(`select--${size}`)
    }
  })

  it('renders prefix text and icon properly', () => {
    const wrapper = mount(Select, {
      props: {
        options: mockOptions,
        icon: 'filter',
        prefix: '絞り込み:',
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

    expect(wrapper.find('.select-prefix').text()).toContain('絞り込み:')

    const icons = wrapper.findAll('.icon')

    expect(icons.some(i => i.attributes('data-icon') === 'filter')).toBe(true)
  })

  it('renders check icon on active option', () => {
    const wrapper = mount(Select, {
      props: {
        options: mockOptions,
        modelValue: 'opt1',
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

    const activeOption = wrapper.find('.custom-select__option.is-active')

    expect(activeOption.exists()).toBe(true)

    const checkIcon = activeOption.find('.option-check')

    expect(checkIcon.exists()).toBe(true)
    expect(checkIcon.attributes('data-icon')).toBe('check')
  })
})
