import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Switch from '../../app/components/common/atoms/Switch.vue'

describe('Switch (Segmented Switch)', () => {
  const options = [
    { label: '電圧降下', value: 'drop' },
    { label: '導体断面積', value: 'size' },
  ]

  it('renders correctly with default props', () => {
    const wrapper = mount(Switch, {
      props: {
        modelValue: 'drop',
        options,
      },
    })

    const buttons = wrapper.findAll('.switch-item')

    expect(buttons.length).toBe(2)
    expect(buttons[0].classes()).toContain('is-active')
    expect(buttons[1].classes()).not.toContain('is-active')
    expect(buttons[0].text()).toContain('電圧降下')
    expect(buttons[1].text()).toContain('導体断面積')
    expect(wrapper.classes()).toContain('switch--md')
  })

  it('updates modelValue and emits change on click', async () => {
    const wrapper = mount(Switch, {
      props: {
        'modelValue': 'drop',
        options,
        'onUpdate:modelValue': (val: string | number) => wrapper.setProps({ modelValue: val }),
      },
    })

    const buttons = wrapper.findAll('.switch-item')

    await buttons[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['size'])
    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')?.[0]).toEqual(['size'])
  })

  it('does not emit when clicking already selected option', async () => {
    const wrapper = mount(Switch, {
      props: {
        modelValue: 'drop',
        options,
      },
    })

    const buttons = wrapper.findAll('.switch-item')

    await buttons[0].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('does not emit when clicking disabled option', async () => {
    const optionsWithDisabled = [
      { label: '電圧降下', value: 'drop' },
      { label: '導体断面積', value: 'size', disabled: true },
    ]

    const wrapper = mount(Switch, {
      props: {
        modelValue: 'drop',
        options: optionsWithDisabled,
      },
    })

    const buttons = wrapper.findAll('.switch-item')

    await buttons[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('handles global disabled prop correctly', async () => {
    const wrapper = mount(Switch, {
      props: {
        modelValue: 'drop',
        options,
        disabled: true,
      },
    })

    expect(wrapper.classes()).toContain('is-disabled')

    const buttons = wrapper.findAll('.switch-item')

    await buttons[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('applies custom size class', () => {
    const wrapper = mount(Switch, {
      props: {
        modelValue: 'drop',
        options,
        size: 'sm',
      },
    })

    expect(wrapper.classes()).toContain('switch--sm')
  })
})
