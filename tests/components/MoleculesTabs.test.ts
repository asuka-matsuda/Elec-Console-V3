import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'

import AtomsTabs from '../../app/components/AtomsTabs.vue'
import MoleculesTabs from '../../app/components/MoleculesTabs.vue'

describe('MoleculesTabs', () => {
  const sampleOptions = [
    { label: 'タブ1', value: 'tab1' },
    { label: 'タブ2', value: 'tab2' },
  ]

  it('renders tab headers and active slot content', () => {
    const wrapper = mount(MoleculesTabs, {
      props: {
        modelValue: 'tab1',
        options: sampleOptions,
      },
      global: {
        components: { AtomsTabs },
      },
      slots: {
        tab1: h('div', { class: 'tab1-content' }, 'タブ1の本文'),
        tab2: h('div', { class: 'tab2-content' }, 'タブ2の本文'),
      },
    })

    // タブヘッダーの確認
    const buttons = wrapper.findAll('button')

    expect(buttons.length).toBe(2)
    expect(buttons[0].classes()).toContain('is-active')
    expect(buttons[1].classes()).not.toContain('is-active')

    // アクティブなスロット（tab1）の内容が表示されていること
    expect(wrapper.find('.tab1-content').exists()).toBe(true)
    expect(wrapper.find('.tab1-content').text()).toBe('タブ1の本文')
    expect(wrapper.find('.tab2-content').exists()).toBe(false)
  })

  it('switches content when tab is clicked', async () => {
    const wrapper = mount(MoleculesTabs, {
      props: {
        'modelValue': 'tab1',
        'options': sampleOptions,
        'onUpdate:modelValue': (val: string | number) => wrapper.setProps({ modelValue: val }),
      },
      global: {
        components: { AtomsTabs },
      },
      slots: {
        tab1: h('div', { class: 'tab1-content' }, 'タブ1の本文'),
        tab2: h('div', { class: 'tab2-content' }, 'タブ2の本文'),
      },
    })

    const buttons = wrapper.findAll('button')

    await buttons[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['tab2'])
  })

  it('supports pill variant', () => {
    const wrapper = mount(MoleculesTabs, {
      props: {
        modelValue: 'tab1',
        options: sampleOptions,
        variant: 'pill',
      },
      global: {
        components: { AtomsTabs },
      },
    })

    const nav = wrapper.find('nav.tabs')

    expect(nav.classes()).toContain('tabs--pill')
  })
})
