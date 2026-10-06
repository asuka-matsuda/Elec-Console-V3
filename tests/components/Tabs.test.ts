import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Tabs from '../../app/components/common/molecules/Tabs.vue'
import type { TabItem } from '../../app/types/components'

describe('Tabs.vue', () => {
  const defaultItems: TabItem[] = [
    { label: '基本情報', value: 'basic', icon: 'info' },
    { label: '連携設定', value: 'integration', icon: 'link', badge: 3 },
    { label: '無効タブ', value: 'disabled-tab', disabled: true },
  ]

  it('renders tab items correctly', () => {
    const wrapper = mount(Tabs, {
      props: {
        items: defaultItems,
        modelValue: 'basic',
      },
      global: {
        stubs: {
          Icon: { template: '<span class="icon-stub" />' },
          Badge: { template: '<span class="badge-stub"><slot /></span>' },
        },
      },
    })

    const buttons = wrapper.findAll('button.tabs-item')

    expect(buttons).toHaveLength(3)
    expect(buttons[0].text()).toContain('基本情報')
    expect(buttons[0].classes()).toContain('is-active')
    expect(buttons[1].text()).toContain('連携設定')
    expect(buttons[1].classes()).not.toContain('is-active')
  })

  it('emits update:modelValue and change when an inactive tab is clicked', async () => {
    const wrapper = mount(Tabs, {
      props: {
        items: defaultItems,
        modelValue: 'basic',
      },
      global: {
        stubs: {
          Icon: true,
          Badge: true,
        },
      },
    })

    const buttons = wrapper.findAll('button.tabs-item')

    await buttons[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['integration'])
    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')![0]).toEqual(['integration'])
  })

  it('does not emit events when the active tab is clicked', async () => {
    const wrapper = mount(Tabs, {
      props: {
        items: defaultItems,
        modelValue: 'basic',
      },
      global: {
        stubs: {
          Icon: true,
          Badge: true,
        },
      },
    })

    const buttons = wrapper.findAll('button.tabs-item')

    await buttons[0].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    expect(wrapper.emitted('change')).toBeFalsy()
  })

  it('does not emit events when a disabled tab is clicked', async () => {
    const wrapper = mount(Tabs, {
      props: {
        items: defaultItems,
        modelValue: 'basic',
      },
      global: {
        stubs: {
          Icon: true,
          Badge: true,
        },
      },
    })

    const buttons = wrapper.findAll('button.tabs-item')

    expect(buttons[2].attributes('disabled')).toBeDefined()
    expect(buttons[2].classes()).toContain('is-disabled')

    await buttons[2].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    expect(wrapper.emitted('change')).toBeFalsy()
  })

  it('does not emit events when component is disabled entirely', async () => {
    const wrapper = mount(Tabs, {
      props: {
        items: defaultItems,
        modelValue: 'basic',
        disabled: true,
      },
      global: {
        stubs: {
          Icon: true,
          Badge: true,
        },
      },
    })

    const nav = wrapper.find('nav.tabs')

    expect(nav.classes()).toContain('is-disabled')

    const buttons = wrapper.findAll('button.tabs-item')

    await buttons[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    expect(wrapper.emitted('change')).toBeFalsy()
  })

  it('renders icon and badge correctly', () => {
    const wrapper = mount(Tabs, {
      props: {
        items: defaultItems,
        modelValue: 'basic',
      },
      global: {
        stubs: {
          Icon: { template: '<span class="icon-stub" />' },
          Badge: { template: '<span class="badge-stub"><slot /></span>' },
        },
      },
    })

    const buttons = wrapper.findAll('button.tabs-item')

    // 1st button has icon but no badge
    expect(buttons[0].find('.icon-stub').exists()).toBe(true)
    expect(buttons[0].find('.badge-stub').exists()).toBe(false)

    // 2nd button has both icon and badge
    expect(buttons[1].find('.icon-stub').exists()).toBe(true)
    expect(buttons[1].find('.badge-stub').exists()).toBe(true)
    expect(buttons[1].find('.badge-stub').text()).toBe('3')
  })

  it('applies correct size classes', () => {
    const wrapperSm = mount(Tabs, {
      props: { items: defaultItems, size: 'sm' },
    })

    expect(wrapperSm.find('nav.tabs').classes()).toContain('tabs-sm')

    const wrapperLg = mount(Tabs, {
      props: { items: defaultItems, size: 'lg' },
    })

    expect(wrapperLg.find('nav.tabs').classes()).toContain('tabs-lg')
  })

  it('does not output accessibility attributes (local/no-pure-accessibility compliance)', () => {
    const wrapper = mount(Tabs, {
      props: {
        items: defaultItems,
        modelValue: 'basic',
      },
      global: {
        stubs: {
          Icon: true,
          Badge: true,
        },
      },
    })

    const nav = wrapper.find('nav.tabs')

    expect(nav.attributes('role')).toBeUndefined()
    expect(nav.attributes('aria-label')).toBeUndefined()

    const buttons = wrapper.findAll('button.tabs-item')

    for (const btn of buttons) {
      expect(btn.attributes('role')).toBeUndefined()
      expect(btn.attributes('aria-selected')).toBeUndefined()
    }
  })
})
