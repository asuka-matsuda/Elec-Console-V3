import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Tooltip from '../../app/components/common/atoms/Tooltip.vue'

describe('Tooltip', () => {
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

  it('shows tooltip bubble on mouseenter and hides on mouseleave', async () => {
    const wrapper = mount(Tooltip, {
      props: {
        text: '詳細な説明テキスト',
      },
      slots: {
        default: '<span>ホバー対象</span>',
      },
      attachTo: document.body,
    })

    // 初期状態では吹き出しなし
    expect(document.body.querySelector('.tooltip-bubble')).toBeNull()

    // ホバー時に表示
    await wrapper.trigger('mouseenter')
    const bubble = document.body.querySelector('.tooltip-bubble')

    expect(bubble).not.toBeNull()
    expect(bubble?.textContent).toContain('詳細な説明テキスト')

    // マウスアウトで非表示
    await wrapper.trigger('mouseleave')
    expect(document.body.querySelector('.tooltip-bubble')).toBeNull()

    wrapper.unmount()
  })

  it('does not show tooltip when disabled is true', async () => {
    const wrapper = mount(Tooltip, {
      props: {
        text: '無効時のテキスト',
        disabled: true,
      },
      slots: {
        default: '<span>対象</span>',
      },
      attachTo: document.body,
    })

    await wrapper.trigger('mouseenter')
    expect(document.body.querySelector('.tooltip-bubble')).toBeNull()

    wrapper.unmount()
  })

  it('toggles visibility on click for touch devices', async () => {
    const wrapper = mount(Tooltip, {
      props: {
        text: 'タップでトグル',
      },
      slots: {
        default: '<span>タップ対象</span>',
      },
      attachTo: document.body,
    })

    // 1回タップで表示
    await wrapper.trigger('click')
    expect(document.body.querySelector('.tooltip-bubble')).not.toBeNull()

    // 再度タップで非表示
    await wrapper.trigger('click')
    expect(document.body.querySelector('.tooltip-bubble')).toBeNull()

    wrapper.unmount()
  })
})
