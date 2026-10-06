import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import Menu from '../../app/components/common/molecules/Menu.vue'

describe('Menu (Geist準拠)', () => {
  const commonStubs = {
    Button: {
      props: ['icon', 'variant', 'disabled', 'size', 'suffixIcon'],
      template: '<button type="button" class="btn-stub" :disabled="disabled"><slot /></button>',
    },
    Tooltip: {
      template: '<div><slot /></div>',
    },
    Icon: {
      props: ['name', 'size'],
      template: '<span class="icon-stub" :data-icon="name" />',
    },
    NuxtLink: {
      props: ['to'],
      template: '<a :href="to" class="nuxt-link-stub"><slot /></a>',
    },
  }

  const sampleItems = [
    { label: 'プロジェクトを複製', action: vi.fn() },
    { label: 'プロジェクトを削除', variant: 'danger' as const, divider: true, action: vi.fn() },
  ]

  it('renders trigger button and remains closed initially', () => {
    const wrapper = mount(Menu, {
      props: {
        items: sampleItems,
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('.btn-stub').exists()).toBe(true)
    expect(document.body.querySelector('.menu-panel')).toBeNull()
  })

  it('opens menu when trigger is clicked and executes action on item click', async () => {
    const duplicateMock = vi.fn()
    const deleteMock = vi.fn()

    const wrapper = mount(Menu, {
      props: {
        items: [
          { label: 'プロジェクトを複製', action: duplicateMock },
          { label: 'プロジェクトを削除', variant: 'danger', divider: true, action: deleteMock },
        ],
      },
      global: {
        stubs: commonStubs,
      },
      attachTo: document.body,
    })

    // トリガークリックで開く
    await wrapper.find('.btn-stub').trigger('click')
    const panel = document.body.querySelector('.menu-panel')

    expect(panel).not.toBeNull()

    const items = panel?.querySelectorAll('.menu-item')

    expect(items).toHaveLength(2)
    expect(items?.[0].textContent).toContain('プロジェクトを複製')
    expect(items?.[1].textContent).toContain('プロジェクトを削除')
    expect(panel?.querySelector('.menu-divider')).not.toBeNull()

    // 項目クリックで action 実行 & メニューが閉じる
    await (items?.[0] as HTMLElement).click()
    expect(duplicateMock).toHaveBeenCalledTimes(1)
    expect(document.body.querySelector('.menu-panel')).toBeNull()

    wrapper.unmount()
  })

  it('does not open when disabled is true', async () => {
    const wrapper = mount(Menu, {
      props: {
        items: sampleItems,
        disabled: true,
      },
      global: {
        stubs: commonStubs,
      },
      attachTo: document.body,
    })

    await wrapper.find('.btn-stub').trigger('click')
    expect(document.body.querySelector('.menu-panel')).toBeNull()

    wrapper.unmount()
  })

  it('renders locked item as disabled with lock icon', async () => {
    const lockedAction = vi.fn()

    const wrapper = mount(Menu, {
      props: {
        items: [
          { label: '管理者設定', locked: true, action: lockedAction },
        ],
      },
      global: {
        stubs: commonStubs,
      },
      attachTo: document.body,
    })

    await wrapper.find('.btn-stub').trigger('click')
    const panel = document.body.querySelector('.menu-panel')

    const button = panel?.querySelector('button.menu-item') as HTMLButtonElement

    expect(button.disabled).toBe(true)
    expect(button.classList.contains('is-disabled')).toBe(true)
    expect(panel?.querySelector('[data-icon="lock"]')).not.toBeNull()

    button.click()
    expect(lockedAction).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('renders section header when section prop is present', async () => {
    const wrapper = mount(Menu, {
      props: {
        items: [
          { label: '設定', section: 'プロジェクト設定' },
        ],
      },
      global: {
        stubs: commonStubs,
      },
      attachTo: document.body,
    })

    await wrapper.find('.btn-stub').trigger('click')
    const panel = document.body.querySelector('.menu-panel')

    const sectionHeader = panel?.querySelector('.menu-section-header')

    expect(sectionHeader).not.toBeNull()
    expect(sectionHeader?.textContent).toContain('プロジェクト設定')

    wrapper.unmount()
  })

  it('closes on Escape key press', async () => {
    const wrapper = mount(Menu, {
      props: {
        items: sampleItems,
      },
      global: {
        stubs: commonStubs,
      },
      attachTo: document.body,
    })

    await wrapper.find('.btn-stub').trigger('click')
    expect(document.body.querySelector('.menu-panel')).not.toBeNull()

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })

    document.dispatchEvent(escapeEvent)
    await wrapper.vm.$nextTick()

    expect(document.body.querySelector('.menu-panel')).toBeNull()

    wrapper.unmount()
  })

  it('does not have pure accessibility attributes (aria-*, role)', async () => {
    const wrapper = mount(Menu, {
      props: {
        items: sampleItems,
      },
      global: {
        stubs: commonStubs,
      },
      attachTo: document.body,
    })

    await wrapper.find('.btn-stub').trigger('click')
    const panel = document.body.querySelector('.menu-panel')

    expect(panel?.hasAttribute('role')).toBe(false)
    expect(panel?.hasAttribute('aria-label')).toBe(false)

    const list = panel?.querySelector('ul')

    expect(list?.hasAttribute('role')).toBe(false)

    wrapper.unmount()
  })
})
