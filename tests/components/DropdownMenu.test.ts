import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import DropdownMenu from '../../app/components/common/molecules/DropdownMenu.vue'

describe('DropdownMenu', () => {
  const commonStubs = {
    Button: {
      props: ['icon', 'variant', 'disabled'],
      template: '<button class="btn-stub" :disabled="disabled"><slot /></button>',
    },
    Icon: true,
  }

  const sampleItems = [
    { label: '編集', action: vi.fn() },
    { label: '削除', variant: 'danger' as const, action: vi.fn() },
  ]

  it('renders trigger button and remains closed initially', () => {
    const wrapper = mount(DropdownMenu, {
      props: {
        items: sampleItems,
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('.btn-stub').exists()).toBe(true)
    expect(document.body.querySelector('.dropdown-panel')).toBeNull()
  })

  it('opens menu when trigger is clicked and executes action on item click', async () => {
    const editMock = vi.fn()
    const deleteMock = vi.fn()

    const wrapper = mount(DropdownMenu, {
      props: {
        items: [
          { label: '編集', action: editMock },
          { label: '削除', variant: 'danger', action: deleteMock },
        ],
      },
      global: {
        stubs: commonStubs,
      },
      attachTo: document.body,
    })

    // トリガークリックで開く
    await wrapper.find('.btn-stub').trigger('click')
    const panel = document.body.querySelector('.dropdown-panel')

    expect(panel).not.toBeNull()

    const items = panel?.querySelectorAll('.dropdown-item')

    expect(items).toHaveLength(2)
    expect(items?.[0].textContent).toContain('編集')
    expect(items?.[1].textContent).toContain('削除')

    // 項目クリックで action 実行 & メニューが閉じる
    await (items?.[0] as HTMLElement).click()
    expect(editMock).toHaveBeenCalledTimes(1)
    expect(document.body.querySelector('.dropdown-panel')).toBeNull()

    wrapper.unmount()
  })

  it('does not open when disabled is true', async () => {
    const wrapper = mount(DropdownMenu, {
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
    expect(document.body.querySelector('.dropdown-panel')).toBeNull()

    wrapper.unmount()
  })
})
