import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MoleculesDashboardMenuTile from '../../app/components/MoleculesDashboardMenuTile.vue'

describe('MoleculesDashboardMenuTile.vue', () => {
  const commonStubs = {
    Icon: {
      props: ['name', 'size'],
      template: '<span class="icon-stub">{{ name }}</span>',
    },
    NuxtLink: {
      props: ['to'],
      template: '<a :href="to" class="nuxt-link-stub"><slot /></a>',
    },
  }

  it('renders title, icon, and description correctly', () => {
    const wrapper = mount(MoleculesDashboardMenuTile, {
      props: {
        to: '/database/cable-db',
        title: 'ケーブル規格DB',
        icon: 'database',
        description: '許容電流や外径などの規格値一覧',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('ケーブル規格DB')
    expect(wrapper.text()).toContain('database')
    expect(wrapper.text()).toContain('許容電流や外径などの規格値一覧')
    expect(wrapper.find('a.nuxt-link-stub').exists()).toBe(true)
    expect(wrapper.classes()).not.toContain('is-disabled')
  })

  it('renders as disabled div when disabled prop is true', () => {
    const wrapper = mount(MoleculesDashboardMenuTile, {
      props: {
        to: '/database/cable-db',
        title: '準備中機能',
        disabled: true,
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('a.nuxt-link-stub').exists()).toBe(false)
    expect(wrapper.element.tagName.toLowerCase()).toBe('div')
    expect(wrapper.classes()).toContain('is-disabled')
  })
})
