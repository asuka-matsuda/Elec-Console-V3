import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'

import Tabs from '../../app/components/common/molecules/Tabs.vue'

describe('Tabs.vue', () => {
  const sampleOptions = [
    { label: '基本設定', value: 'basic' },
    { label: '詳細設定', value: 'advanced' },
    { label: '無効タブ', value: 'disabled', disabled: true },
  ]

  it('renders tabs and panel content correctly with panel slots', () => {
    const wrapper = mount(Tabs, {
      props: {
        modelValue: 'basic',
        options: sampleOptions,
      },
      slots: {
        basic: h('div', { class: 'panel-basic' }, '基本設定コンテンツ'),
        advanced: h('div', { class: 'panel-advanced' }, '詳細設定コンテンツ'),
      },
    })

    const tabs = wrapper.findAll('.tabs__item')

    expect(tabs.length).toBe(3)
    expect(tabs[0].attributes('tabindex')).toBe('0')
    expect(tabs[0].classes()).toContain('is-active')

    expect(tabs[1].attributes('tabindex')).toBe('-1')
    expect(tabs[1].classes()).not.toContain('is-active')

    expect(tabs[2].attributes('disabled')).toBeDefined()

    const panel = wrapper.find('.tabs__panel')

    expect(panel.exists()).toBe(true)
    expect(panel.text()).toBe('基本設定コンテンツ')
  })

  it('switches content and emits change event on tab click', async () => {
    const wrapper = mount(Tabs, {
      props: {
        'modelValue': 'basic',
        'options': sampleOptions,
        'onUpdate:modelValue': (val: string) => wrapper.setProps({ modelValue: val }),
      },
      slots: {
        basic: h('div', { class: 'panel-basic' }, '基本設定コンテンツ'),
        advanced: h('div', { class: 'panel-advanced' }, '詳細設定コンテンツ'),
      },
    })

    const tabs = wrapper.findAll('.tabs__item')

    await tabs[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['advanced'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['advanced'])

    // スロットパネルが advanced に切り替わること
    expect(wrapper.find('.panel-advanced').exists()).toBe(true)
    expect(wrapper.find('.panel-basic').exists()).toBe(false)
  })

  it('does not select disabled tab on click', async () => {
    const wrapper = mount(Tabs, {
      props: {
        modelValue: 'basic',
        options: sampleOptions,
      },
    })

    const tabs = wrapper.findAll('.tabs__item')

    await tabs[2].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('supports keyboard navigation (ArrowRight / ArrowLeft / Home / End)', async () => {
    const wrapper = mount(Tabs, {
      props: {
        'modelValue': 'basic',
        'options': sampleOptions,
        'onUpdate:modelValue': (val: string) => wrapper.setProps({ modelValue: val }),
      },
      slots: {
        basic: h('div', '基本'),
        advanced: h('div', '詳細'),
      },
    })

    const tabs = wrapper.findAll('.tabs__item')

    // ArrowRight で次のタブへ
    await tabs[0].trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['advanced'])

    // ArrowLeft で前のタブへ
    await tabs[1].trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual(['basic'])

    // End で最後の有効なタブ（disabled はスキップされて advanced）へ
    await tabs[0].trigger('keydown', { key: 'End' })
    expect(wrapper.emitted('update:modelValue')?.[2]).toEqual(['advanced'])

    // Home で最初の有効なタブ（basic）へ
    await tabs[1].trigger('keydown', { key: 'Home' })
    expect(wrapper.emitted('update:modelValue')?.[3]).toEqual(['basic'])
  })

  it('does not render panel area when no panel slots are provided (standalone switch mode)', () => {
    const wrapper = mount(Tabs, {
      props: {
        modelValue: 'basic',
        options: sampleOptions,
      },
    })

    expect(wrapper.find('.tabs__panel').exists()).toBe(false)
    expect(wrapper.findAll('.tabs__item').length).toBe(3)
  })

  it('renders custom tab slot', () => {
    const wrapper = mount(Tabs, {
      props: {
        modelValue: 'basic',
        options: sampleOptions,
      },
      slots: {
        tab: '<template #tab="{ option, isActive }"><span class="custom-tab">{{ option.label }} [{{ isActive }}]</span></template>',
      },
    })

    const customTabs = wrapper.findAll('.custom-tab')

    expect(customTabs[0].text()).toBe('基本設定 [true]')
    expect(customTabs[1].text()).toBe('詳細設定 [false]')
  })

  it('renders icon and badge when provided in option', () => {
    const wrapper = mount(Tabs, {
      props: {
        modelValue: 'notifications',
        options: [
          {
            label: 'お知らせ',
            value: 'notifications',
            badge: 3,
          },
        ],
      },
    })

    expect(wrapper.text()).toContain('お知らせ')
    expect(wrapper.text()).toContain('3')
  })

  it('does not re-emit change when clicking already selected tab', async () => {
    const wrapper = mount(Tabs, {
      props: {
        modelValue: 'basic',
        options: sampleOptions,
      },
    })

    const tabs = wrapper.findAll('.tabs__item')

    await tabs[0].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()

    expect(wrapper.emitted('change')).toBeFalsy()
  })

  it('supports keepAlive prop for caching tab content', () => {
    const wrapper = mount(Tabs, {
      props: {
        modelValue: 'basic',
        options: sampleOptions,
        keepAlive: true,
      },
      slots: {
        basic: h('div', { class: 'panel-basic' }, 'キャッシュパネル'),
      },
    })

    const panel = wrapper.find('.tabs__panel')

    expect(panel.exists()).toBe(true)

    expect(panel.text()).toBe('キャッシュパネル')
  })
})
