import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Breadcrumbs from '../../app/components/common/molecules/Breadcrumbs.vue'

describe('Breadcrumbs.vue', () => {
  it('renders nothing when items is empty', () => {
    const wrapper = mount(Breadcrumbs, {
      props: {
        items: [],
      },
      global: {
        stubs: {
          Icon: true,
          NuxtLink: true,
        },
      },
    })

    expect(wrapper.find('nav').exists()).toBe(false)
  })

  it('renders breadcrumb items correctly', () => {
    const items = [
      { text: 'ホーム', to: '/' },
      { text: '現場管理', to: '/portal' },
      { text: '送電試験' },
    ]

    const wrapper = mount(Breadcrumbs, {
      props: { items },
      global: {
        stubs: {
          Icon: true,
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    const liElements = wrapper.findAll('li')

    expect(liElements).toHaveLength(3)

    // 1st item: link
    expect(liElements[0].find('a').exists()).toBe(true)
    expect(liElements[0].find('a').text()).toBe('ホーム')
    expect(liElements[0].classes()).not.toContain('is-active')

    // 2nd item: link
    expect(liElements[1].find('a').exists()).toBe(true)
    expect(liElements[1].find('a').text()).toBe('現場管理')
    expect(liElements[1].classes()).not.toContain('is-active')

    // 3rd item (last): static span & is-active & has-cursor
    expect(liElements[2].find('a').exists()).toBe(false)
    expect(liElements[2].find('span.breadcrumb-text').text()).toBe('送電試験')
    expect(liElements[2].classes()).toContain('is-active')
    expect(liElements[2].classes()).toContain('has-cursor')
  })

  it('renders separators between items but not after the last item', () => {
    const items = [
      { text: 'A' },
      { text: 'B' },
      { text: 'C' },
    ]

    const wrapper = mount(Breadcrumbs, {
      props: { items },
      global: {
        stubs: {
          Icon: true,
          NuxtLink: true,
        },
      },
    })

    const separators = wrapper.findAll('.breadcrumb-separator')

    expect(separators).toHaveLength(2)
  })

  it('renders custom separator text when separator prop is provided', () => {
    const items = [
      { text: 'A' },
      { text: 'B' },
    ]

    const wrapper = mount(Breadcrumbs, {
      props: {
        items,
        separator: '/',
      },
      global: {
        stubs: {
          Icon: true,
          NuxtLink: true,
        },
      },
    })

    expect(wrapper.find('.breadcrumb-separator').text()).toBe('/')
  })

  it('handles disabled item correctly', () => {
    const items = [
      { text: 'A', to: '/a', disabled: true },
      { text: 'B' },
    ]

    const wrapper = mount(Breadcrumbs, {
      props: { items },
      global: {
        stubs: {
          Icon: true,
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    const liElements = wrapper.findAll('li')

    expect(liElements[0].classes()).toContain('is-disabled')
    // disabled item should NOT be a link even if to is provided
    expect(liElements[0].find('a').exists()).toBe(false)
    expect(liElements[0].find('span.breadcrumb-text').text()).toBe('A')
  })

  it('toggles cursor blink effect via cursor prop', () => {
    const items = [{ text: 'ホーム' }]

    const wrapperWithCursor = mount(Breadcrumbs, {
      props: { items, cursor: true },
      global: {
        stubs: { Icon: true, NuxtLink: true },
      },
    })

    expect(wrapperWithCursor.find('li').classes()).toContain('has-cursor')

    const wrapperWithoutCursor = mount(Breadcrumbs, {
      props: { items, cursor: false },
      global: {
        stubs: { Icon: true, NuxtLink: true },
      },
    })

    expect(wrapperWithoutCursor.find('li').classes()).not.toContain('has-cursor')
  })
})
