import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import OrganismsGlobalNav from '../../app/components/OrganismsGlobalNav.vue'
import { menuData } from '../../app/constants/data/menuData'

vi.mock('vue-router', () => ({
  useRoute: () => ({
    fullPath: '/',
  }),
}))

describe('OrganismsGlobalNav.vue', () => {
  const defaultStubs = {
    Button: {
      template: '<button class="close-btn" @click="$emit(\'click\')"><slot /></button>',
    },
    MoleculesSectionHeader: {
      template: '<div class="section-header-stub">{{ title }}</div>',
      props: ['title'],
    },
    AtomsDivider: true,
    Icon: true,
    NuxtLink: {
      template: '<a class="link-stub" :href="to" @click="$emit(\'click\')"><slot /></a>',
      props: ['to'],
    },
  }

  const createWrapper = (props = {}) => {
    return mount(OrganismsGlobalNav, {
      props: {
        isOpen: false,
        menuData,
        ...props,
      },
      global: {
        stubs: defaultStubs,
      },
    })
  }

  it('renders closed state by default', () => {
    const wrapper = createWrapper({ isOpen: false })

    const aside = wrapper.find('aside')

    expect(aside.classes()).not.toContain('is-open')
    const overlay = wrapper.find('.overlay')

    expect(overlay.classes()).not.toContain('is-open')
  })

  it('renders open state when isOpen is true', () => {
    const wrapper = createWrapper({ isOpen: true })

    const aside = wrapper.find('aside')

    expect(aside.classes()).toContain('is-open')
    const overlay = wrapper.find('.overlay')

    expect(overlay.classes()).toContain('is-open')
  })

  it('emits update:isOpen false when overlay is clicked', async () => {
    const wrapper = createWrapper({ isOpen: true })

    await wrapper.find('.overlay').trigger('click')
    expect(wrapper.emitted('update:isOpen')).toBeTruthy()
    expect(wrapper.emitted('update:isOpen')![0]).toEqual([false])
  })

  it('emits update:isOpen false when close button is clicked', async () => {
    const wrapper = createWrapper({ isOpen: true })

    await wrapper.find('.close-btn').trigger('click')
    expect(wrapper.emitted('update:isOpen')).toBeTruthy()
    expect(wrapper.emitted('update:isOpen')![0]).toEqual([false])
  })

  it('renders menu section titles and items correctly', () => {
    const wrapper = createWrapper({ isOpen: true })

    expect(wrapper.text()).toContain('計算ツール')
    expect(wrapper.text()).toContain('電圧降下計算')
  })

  it('closes on Escape key press when open', async () => {
    const wrapper = createWrapper({ isOpen: true })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('update:isOpen')).toBeTruthy()
    expect(wrapper.emitted('update:isOpen')![0]).toEqual([false])
  })
})
