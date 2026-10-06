import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Tooltip from '../../app/components/common/atoms/Tooltip.vue'

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('renders trigger element inside span wrapper', () => {
    const wrapper = mount(Tooltip, {
      props: {
        text: 'ヘルプテキスト',
      },
      slots: {
        default: '<button class="test-btn">クリック</button>',
      },
    })

    expect(wrapper.element.tagName.toLowerCase()).toBe('span')
    expect(wrapper.classes()).toContain('tooltip-wrapper')
    expect(wrapper.find('.test-btn').exists()).toBe(true)
    expect(wrapper.find('.test-btn').text()).toBe('クリック')
  })

  it('shows tooltip bubble after default 150ms delay on mouseenter and hides on mouseleave', async () => {
    const wrapper = mount(Tooltip, {
      props: {
        text: '詳細な説明テキスト',
      },
      slots: {
        default: '<span>ホバー対象</span>',
      },
      attachTo: document.body,
    })

    // 初期状態では非表示
    expect(document.body.querySelector('.tooltip-bubble')).toBeNull()

    // ホバー直後（まだ150ms未経過）
    await wrapper.trigger('mouseenter')
    expect(document.body.querySelector('.tooltip-bubble')).toBeNull()

    // 150ms 経過
    vi.advanceTimersByTime(150)
    await wrapper.vm.$nextTick()
    const bubble = document.body.querySelector('.tooltip-bubble')

    expect(bubble).not.toBeNull()
    expect(bubble?.textContent).toContain('詳細な説明テキスト')

    // マウスアウトで非表示
    await wrapper.trigger('mouseleave')
    expect(document.body.querySelector('.tooltip-bubble')).toBeNull()

    wrapper.unmount()
  })

  it('shows tooltip immediately when delay is 0', async () => {
    const wrapper = mount(Tooltip, {
      props: {
        text: '即時表示テキスト',
        delay: 0,
      },
      slots: {
        default: '<span>ホバー対象</span>',
      },
      attachTo: document.body,
    })

    await wrapper.trigger('mouseenter')
    await wrapper.vm.$nextTick()
    const bubble = document.body.querySelector('.tooltip-bubble')

    expect(bubble).not.toBeNull()
    expect(bubble?.textContent).toContain('即時表示テキスト')

    wrapper.unmount()
  })

  it('does not show tooltip when disabled is true', async () => {
    const wrapper = mount(Tooltip, {
      props: {
        text: '無効時のテキスト',
        disabled: true,
        delay: 0,
      },
      slots: {
        default: '<span>対象</span>',
      },
      attachTo: document.body,
    })

    await wrapper.trigger('mouseenter')
    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('.tooltip-bubble')).toBeNull()

    wrapper.unmount()
  })

  it('closes tooltip on Escape key press', async () => {
    const wrapper = mount(Tooltip, {
      props: {
        text: 'Escapeで閉じるテキスト',
        delay: 0,
      },
      slots: {
        default: '<span>対象</span>',
      },
      attachTo: document.body,
    })

    await wrapper.trigger('mouseenter')
    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('.tooltip-bubble')).not.toBeNull()

    // Escape キー押下
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('.tooltip-bubble')).toBeNull()

    wrapper.unmount()
  })

  it('supports custom types and placement classes', async () => {
    const wrapper = mount(Tooltip, {
      props: {
        text: '警告テキスト',
        type: 'warning',
        placement: 'bottom-start',
        delay: 0,
      },
      slots: {
        default: '<span>対象</span>',
      },
      attachTo: document.body,
    })

    await wrapper.trigger('mouseenter')
    await wrapper.vm.$nextTick()
    const bubble = document.body.querySelector('.tooltip-bubble')

    expect(bubble).not.toBeNull()
    expect(bubble?.classList.contains('is-type-warning')).toBe(true)
    expect(bubble?.classList.contains('is-bottom-start')).toBe(true)

    wrapper.unmount()
  })

  it('renders rich content via slot', async () => {
    const wrapper = mount(Tooltip, {
      props: {
        delay: 0,
      },
      slots: {
        default: '<span>対象</span>',
        content: '<strong class="rich-tip">リッチなツールチップ</strong>',
      },
      attachTo: document.body,
    })

    await wrapper.trigger('mouseenter')
    await wrapper.vm.$nextTick()
    const richTip = document.body.querySelector('.rich-tip')

    expect(richTip).not.toBeNull()
    expect(richTip?.textContent).toBe('リッチなツールチップ')

    wrapper.unmount()
  })

  it('toggles visibility on click for touch devices', async () => {
    const wrapper = mount(Tooltip, {
      props: {
        text: 'タップでトグル',
        delay: 0,
      },
      slots: {
        default: '<span>タップ対象</span>',
      },
      attachTo: document.body,
    })

    // 1回タップで表示
    await wrapper.trigger('click')
    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('.tooltip-bubble')).not.toBeNull()

    // 再度タップで非表示
    await wrapper.trigger('click')
    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('.tooltip-bubble')).toBeNull()

    wrapper.unmount()
  })
})
