import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'

import GlobalNav from '../../app/components/common/organisms/GlobalNav.vue'
import { menuData } from '../../app/constants/data/menuData'

const mockRoute = reactive({
  path: '/',
  fullPath: '/',
})

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}))

describe('GlobalNav.vue', () => {
  const defaultStubs = {
    Button: {
      template: '<button class="close-btn" @click="$emit(\'click\')"><slot /></button>',
    },
    SectionHeader: {
      template: '<div class="section-header-stub">{{ title }}</div>',
      props: ['title'],
    },
    Divider: true,
    Icon: true,
    NuxtLink: {
      template: '<a class="link-stub" :href="to" @click="$emit(\'click\')"><slot /></a>',
      props: ['to'],
    },
  }

  const createWrapper = (props = {}) => {
    return mount(GlobalNav, {
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
    mockRoute.path = '/'
    mockRoute.fullPath = '/'
    const wrapper = createWrapper({ isOpen: false })

    const aside = wrapper.find('aside')

    expect(aside.classes()).not.toContain('is-open')

    const overlay = wrapper.find('.overlay')

    expect(overlay.classes()).not.toContain('is-open')
  })

  it('renders open state when isOpen is true', () => {
    mockRoute.path = '/'
    mockRoute.fullPath = '/'
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

  it('emits update:isOpen false when menu link is clicked', async () => {
    const wrapper = createWrapper({ isOpen: true })

    const firstLink = wrapper.find('.link-stub')

    await firstLink.trigger('click')

    expect(wrapper.emitted('update:isOpen')).toBeTruthy()
    expect(wrapper.emitted('update:isOpen')![0]).toEqual([false])
  })

  it('activates 現場ポータル for portal subpaths like /portal/site-1', () => {
    mockRoute.path = '/portal/site-1'
    mockRoute.fullPath = '/portal/site-1'
    const wrapper = createWrapper({ isOpen: true })

    const links = wrapper.findAll('.link-stub')
    const portalLink = links.find(w => w.attributes('href') === '/portal')
    const adminLink = links.find(w => w.attributes('href') === '/portal/admin')

    expect(portalLink?.classes()).toContain('is-active')
    expect(adminLink?.classes()).not.toContain('is-active')
  })

  it('activates ポータル管理 for /portal/admin instead of 現場ポータル', () => {
    mockRoute.path = '/portal/admin'
    mockRoute.fullPath = '/portal/admin'
    const wrapper = createWrapper({ isOpen: true })

    const links = wrapper.findAll('.link-stub')
    const portalLink = links.find(w => w.attributes('href') === '/portal')
    const adminLink = links.find(w => w.attributes('href') === '/portal/admin')

    expect(portalLink?.classes()).not.toContain('is-active')
    expect(adminLink?.classes()).toContain('is-active')
  })
})
