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

    expect((items[0].element as HTMLButtonElement).disabled).toBe(false)
    expect((items[1].element as HTMLButtonElement).disabled).toBe(false)
    expect((items[2].element as HTMLButtonElement).disabled).toBe(true)
  })

  it('updates modelValue on option selection', async () => {
    const wrapper = mount(RadioGroup, {
      props: {
        'modelValue': 'a',
        'options': sampleOptions,
        'onUpdate:modelValue': (val: string) => wrapper.setProps({ modelValue: val }),
      },
    })

    const items = wrapper.findAll('.item')

    await items[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b'])
  })

  it('does not select disabled option on click', async () => {
    const wrapper = mount(RadioGroup, {
      props: {
        modelValue: 'a',
        options: sampleOptions,
      },
    })

    const items = wrapper.findAll('.item')

    await items[2].trigger('click')

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
      expect((item.element as HTMLButtonElement).disabled).toBe(true)
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

    expect(wrapper.classes()).toContain('w-full')

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
        option: '<template #option="{ option, isActive }"><span class="custom-opt">{{ option.label }} - {{ isActive }}</span></template>',
      },
    })

    const customOpts = wrapper.findAll('.custom-opt')

    expect(customOpts.length).toBe(3)
    expect(customOpts[0].text()).toBe('オプションA - true')
    expect(customOpts[1].text()).toBe('オプションB - false')
  })
})
