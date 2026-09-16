import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Breadcrumb from '../../app/components/common/molecules/Breadcrumb.vue'

describe('Breadcrumb.vue', () => {
  const dummyItems = [
    { text: '現場管理' },
    { text: '現場A' },
    { text: '送電試験' },
  ]

  it('パンくずアイテムを正しく描画する', () => {
    const wrapper = mount(Breadcrumb, {
      props: { items: dummyItems },
    })

    const listItems = wrapper.findAll('li')

    expect(listItems).toHaveLength(3)
    expect(listItems[0].text()).toContain('現場管理')
    expect(listItems[1].text()).toContain('現場A')
    expect(listItems[2].text()).toContain('送電試験')
  })

  it('最後のアイテムに is-current クラスが付与される', () => {
    const wrapper = mount(Breadcrumb, {
      props: { items: dummyItems },
    })

    const listItems = wrapper.findAll('li')

    expect(listItems[0].classes()).not.toContain('is-current')
    expect(listItems[1].classes()).not.toContain('is-current')
    expect(listItems[2].classes()).toContain('is-current')
  })

  it('itemsが空配列の場合はnav要素自体を描画しない', () => {
    const wrapper = mount(Breadcrumb, {
      props: { items: [] },
    })

    expect(wrapper.find('nav').exists()).toBe(false)
  })
})
