import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import RadioGroup from '../../app/components/common/atoms/RadioGroup.vue'

describe('RadioGroup.vue', () => {
  const sampleOptions = [
    { label: 'オプションA', value: 'a' },
    { label: 'オプションB', value: 'b' },
    { label: 'オプションC (無効)', value: 'c', disabled: true },
  ]

  it('renders radio options correctly', () => {
    const wrapper = mount(RadioGroup, {
      props: {
        modelValue: 'a',
        options: sampleOptions,
      },
    })

    const items = wrapper.findAll('.item')

    expect(items.length).toBe(3)
    expect(items[0].classes()).toContain('is-active')
    expect(items[1].classes()).not.toContain('is-active')
    expect(items[2].classes()).toContain('is-disabled')

    const inputs = wrapper.findAll('input[type="radio"]')

    expect((inputs[0].element as HTMLInputElement).checked).toBe(true)
    expect((inputs[1].element as HTMLInputElement).checked).toBe(false)
    expect((inputs[2].element as HTMLInputElement).disabled).toBe(true)
  })

  it('updates modelValue and emits change on option selection', async () => {
    const wrapper = mount(RadioGroup, {
      props: {
        'modelValue': 'a',
        'options': sampleOptions,
        'onUpdate:modelValue': (val: string) => wrapper.setProps({ modelValue: val }),
      },
    })

    const inputs = wrapper.findAll('input[type="radio"]')

    await inputs[1].trigger('change')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['b'])
  })

  it('does not select disabled option on change', async () => {
    const wrapper = mount(RadioGroup, {
      props: {
        modelValue: 'a',
        options: sampleOptions,
      },
    })

    const inputs = wrapper.findAll('input[type="radio"]')

    await inputs[2].trigger('change')

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('supports group-level disabled prop', () => {
    const wrapper = mount(RadioGroup, {
      props: {
        modelValue: 'a',
        options: sampleOptions,
        disabled: true,
      },
    })

    const items = wrapper.findAll('.item')

    items.forEach((item) => {
      expect(item.classes()).toContain('is-disabled')
    })

    const inputs = wrapper.findAll('input[type="radio"]')

    inputs.forEach((input) => {
      expect((input.element as HTMLInputElement).disabled).toBe(true)
    })
  })

  it('supports block layout', () => {
    const wrapper = mount(RadioGroup, {
      props: {
        modelValue: 'a',
        options: sampleOptions,
        block: true,
      },
    })

    expect(wrapper.classes()).toContain('radio-group--block')

    const items = wrapper.findAll('.item')

    items.forEach((item) => {
      expect(item.classes()).toContain('flex-1')
    })
  })

  it('renders custom option slot', () => {
    const wrapper = mount(RadioGroup, {
      props: {
        modelValue: 'a',
        options: sampleOptions,
      },
      slots: {
        option: '<template #option="{ option, isSelected }"><span class="custom-opt">{{ option.label }} - {{ isSelected }}</span></template>',
      },
    })

    const customOpts = wrapper.findAll('.custom-opt')

    expect(customOpts.length).toBe(3)
    expect(customOpts[0].text()).toBe('オプションA - true')
    expect(customOpts[1].text()).toBe('オプションB - false')
  })
})
