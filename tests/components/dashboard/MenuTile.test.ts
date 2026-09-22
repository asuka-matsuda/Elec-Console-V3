import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Panel from '../../../app/components/common/atoms/Panel.vue'
import MenuTile from '../../../app/components/dashboard/MenuTile.vue'

describe('MenuTile.vue (app/components/dashboard/MenuTile.vue)', () => {
  const commonStubs = {
    Icon: {
      props: ['name', 'size'],
      template: '<span class="icon-stub">{{ name }}</span>',
    },
    NuxtLink: {
      props: ['to'],
      template: '<a :href="to" class="nuxt-link-stub"><slot /></a>',
    },
    Panel,
  }

  it('renders title, icon, and description correctly as NuxtLink', () => {
    const wrapper = mount(MenuTile, {
      props: {
        item: {
          text: 'ケーブル規格DB',
          href: '/database/cable-db',
          icon: 'database',
          desc: '許容電流や外径などの規格値一覧',
        },
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('ケーブル規格DB')
    expect(wrapper.text()).toContain('database')
    expect(wrapper.text()).toContain('許容電流や外径などの規格値一覧')
    expect(wrapper.find('a.nuxt-link-stub').exists()).toBe(true)
    expect(wrapper.classes()).toContain('is-interactive')
    expect(wrapper.classes()).not.toContain('is-disabled')
  })

  it('renders as disabled div when item.disabled is true', () => {
    const wrapper = mount(MenuTile, {
      props: {
        item: {
          text: '準備中機能',
          href: '/database/cable-db',
          disabled: true,
        },
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('a.nuxt-link-stub').exists()).toBe(false)
    expect(wrapper.element.tagName.toLowerCase()).toBe('div')
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.classes()).not.toContain('is-interactive')
  })

  it('renders as div without link when item.href is empty', () => {
    const wrapper = mount(MenuTile, {
      props: {
        item: {
          text: 'リンクなし機能',
          href: '',
        },
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('a.nuxt-link-stub').exists()).toBe(false)
    expect(wrapper.element.tagName.toLowerCase()).toBe('div')
    expect(wrapper.classes()).not.toContain('is-interactive')
  })

  it('renders correctly without icon and description', () => {
    const wrapper = mount(MenuTile, {
      props: {
        item: {
          text: 'タイトルのみ',
          href: '/tools/simple',
        },
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('タイトルのみ')
    expect(wrapper.find('.icon-stub').exists()).toBe(false)
    expect(wrapper.find('.tile-desc').exists()).toBe(false)
  })
})
