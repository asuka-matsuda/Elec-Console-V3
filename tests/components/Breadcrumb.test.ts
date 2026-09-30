import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Breadcrumb from '../../app/components/common/molecules/Breadcrumb.vue'

describe('Breadcrumb.vue', () => {
  it('itemsが空の場合はnav要素がレンダリングされない', () => {
    const wrapper = mount(Breadcrumb, {
      props: {
        items: [],
      },
    })

    expect(wrapper.find('nav').exists()).toBe(false)
  })

  it('itemsが渡された場合に全てのアイテムテキストが表示される', () => {
    const items = [
      { text: '現場管理' },
      { text: '東京第1現場' },
      { text: '送電試験' },
    ]
    const wrapper = mount(Breadcrumb, {
      props: { items },
    })

    const nav = wrapper.find('nav')

    expect(nav.exists()).toBe(true)

    const listItems = wrapper.findAll('li')

    expect(listItems).toHaveLength(3)
    expect(wrapper.text()).toContain('現場管理')
    expect(wrapper.text()).toContain('東京第1現場')
    expect(wrapper.text()).toContain('送電試験')
  })

  it('末尾のアイテムにのみis-activeが付与される', () => {
    const items = [
      { text: '現場管理' },
      { text: '東京第1現場' },
      { text: '送電試験' },
    ]
    const wrapper = mount(Breadcrumb, {
      props: { items },
    })

    const listItems = wrapper.findAll('li')

    expect(listItems[0].classes()).not.toContain('is-active')
    expect(listItems[1].classes()).not.toContain('is-active')
    expect(listItems[2].classes()).toContain('is-active')
  })

  it('デフォルトで末尾アイテムにhas-cursorが付与され、showCursor=falseで除外される', () => {
    const items = [{ text: 'ホーム' }, { text: '設定' }]

    const wrapperWithCursor = mount(Breadcrumb, {
      props: { items },
    })
    const lastItemWithCursor = wrapperWithCursor.findAll('li')[1]

    expect(lastItemWithCursor.classes()).toContain('has-cursor')

    const wrapperWithoutCursor = mount(Breadcrumb, {
      props: { items, showCursor: false },
    })
    const lastItemWithoutCursor = wrapperWithoutCursor.findAll('li')[1]

    expect(lastItemWithoutCursor.classes()).not.toContain('has-cursor')
  })

  it('セパレーターが正しく描画され、Propやスロットでカスタマイズできる', () => {
    const items = [{ text: 'A' }, { text: 'B' }, { text: 'C' }]

    // デフォルト: » が 2つ
    const wrapperDefault = mount(Breadcrumb, {
      props: { items },
    })
    const separatorsDefault = wrapperDefault.findAll('.separator')

    expect(separatorsDefault).toHaveLength(2)
    expect(separatorsDefault[0].text()).toBe('»')

    // custom prop: /
    const wrapperProp = mount(Breadcrumb, {
      props: { items, separator: '/' },
    })
    const separatorsProp = wrapperProp.findAll('.separator')

    expect(separatorsProp[0].text()).toBe('/')

    // custom slot
    const wrapperSlot = mount(Breadcrumb, {
      props: { items },
      slots: {
        separator: '<span class="custom-sep">></span>',
      },
    })

    expect(wrapperSlot.find('.custom-sep').text()).toBe('>')
  })
})
