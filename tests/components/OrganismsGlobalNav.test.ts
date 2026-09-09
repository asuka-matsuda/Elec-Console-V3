import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import OrganismsGlobalNav from '../../app/components/OrganismsGlobalNav.vue'
import type { MenuSection } from '../../app/constants/data/menuData'

vi.mock('vue-router', () => ({
  useRoute: () => ({
    fullPath: '/',
  }),
}))

describe('OrganismsGlobalNav.vue', () => {
  const mockMenuData: MenuSection[] = [
    {
      heading: '計算ツール',
      accent: 'tool',
      items: [
        {
          text: '電圧降下計算',
          href: '/tools/voltage',
          icon: 'zap',
        },
        {
          text: '配管選定',
          href: '/tools/conduit',
          icon: 'cylinder',
        },
      ],
    },
  ]

  const defaultStubs = {
    MoleculesIconButton: {
      template: '<button class="close-btn" @click="$emit(\'click\')">X</button>',
    },
    MoleculesSectionHeader: {
      template: '<div class="section-header-stub">{{ title }}</div>',
      props: ['title'],
    },
    AtomsDivider: true,
    AtomsIcon: true,
    NuxtLink: {
      template: '<a class="link-stub" :href="to" @click="$emit(\'click\')"><slot /></a>',
      props: ['to'],
    },
  }

  it('renders closed state by default', () => {
    const wrapper = mount(OrganismsGlobalNav, {
      props: {
        isOpen: false,
        menuData: mockMenuData,
      },
      global: {
        stubs: defaultStubs,
      },
    })

    const aside = wrapper.find('aside')
    expect(aside.classes()).not.toContain('is-open')
    const overlay = wrapper.find('.overlay')
    expect(overlay.classes()).not.toContain('is-open')
  })

  it('renders open state when isOpen is true', () => {
    const wrapper = mount(OrganismsGlobalNav, {
      props: {
        isOpen: true,
        menuData: mockMenuData,
      },
      global: {
        stubs: defaultStubs,
      },
    })

    const aside = wrapper.find('aside')
    expect(aside.classes()).toContain('is-open')
    const overlay = wrapper.find('.overlay')
    expect(overlay.classes()).toContain('is-open')
  })

  it('emits update:isOpen false when overlay is clicked', async () => {
    const wrapper = mount(OrganismsGlobalNav, {
      props: {
        isOpen: true,
        menuData: mockMenuData,
      },
      global: {
        stubs: defaultStubs,
      },
    })

    await wrapper.find('.overlay').trigger('click')
    expect(wrapper.emitted('update:isOpen')).toBeTruthy()
    expect(wrapper.emitted('update:isOpen')![0]).toEqual([false])
  })

  it('emits update:isOpen false when close button is clicked', async () => {
    const wrapper = mount(OrganismsGlobalNav, {
      props: {
        isOpen: true,
        menuData: mockMenuData,
      },
      global: {
        stubs: defaultStubs,
      },
    })

    await wrapper.find('.close-btn').trigger('click')
    expect(wrapper.emitted('update:isOpen')).toBeTruthy()
    expect(wrapper.emitted('update:isOpen')![0]).toEqual([false])
  })

  it('renders menu section titles and items correctly', () => {
    const wrapper = mount(OrganismsGlobalNav, {
      props: {
        isOpen: true,
        menuData: mockMenuData,
      },
      global: {
        stubs: defaultStubs,
      },
    })

    expect(wrapper.text()).toContain('計算ツール')
    expect(wrapper.text()).toContain('電圧降下計算')
    expect(wrapper.text()).toContain('配管選定')
  })

  it('closes on Escape key press when open', async () => {
    const wrapper = mount(OrganismsGlobalNav, {
      props: {
        isOpen: true,
        menuData: mockMenuData,
      },
      global: {
        stubs: defaultStubs,
      },
    })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('update:isOpen')).toBeTruthy()
    expect(wrapper.emitted('update:isOpen')![0]).toEqual([false])
  })
})
