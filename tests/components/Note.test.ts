import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import Note from '../../app/components/common/molecules/Note.vue'

describe('Note (Geist準拠)', () => {
  const mountNote = (options: Parameters<typeof mount>[1] = {}) => {
    return mount(Note, {
      ...options,
      global: {
        stubs: {
          Icon: {
            props: ['name'],
            template: '<span class="icon-stub" :data-name="name" />',
          },
          Button: {
            props: ['size', 'variant'],
            template: '<button type="button" class="btn-stub"><slot /></button>',
          },
        },
        ...options.global,
      },
    })
  }

  it('renders default secondary variant with info icon', () => {
    const wrapper = mountNote({
      props: {
        text: '中立的な情報メッセージ',
      },
    })

    expect(wrapper.classes()).toContain('is-secondary')
    expect(wrapper.find('.icon-stub').attributes('data-name')).toBe('info')
    expect(wrapper.text()).toContain('中立的な情報メッセージ')
  })

  it('renders proper classes and default icons for Geist variants', () => {
    const variants = [
      { variant: 'secondary', icon: 'info', className: 'is-secondary' },
      { variant: 'success', icon: 'check', className: 'is-success' },
      { variant: 'warning', icon: 'alert-triangle', className: 'is-warning' },
      { variant: 'error', icon: 'alert-circle', className: 'is-error' },
      // 後方互換
      { variant: 'danger', icon: 'alert-circle', className: 'is-error' },
      { variant: 'info', icon: 'info', className: 'is-secondary' },
    ] as const

    for (const { variant, icon, className } of variants) {
      const wrapper = mountNote({
        props: { variant, text: 'テスト' },
      })

      expect(wrapper.classes()).toContain(className)
      expect(wrapper.find('.icon-stub').attributes('data-name')).toBe(icon)
    }
  })

  it('applies is-fill class when fill prop is true', () => {
    const wrapper = mountNote({
      props: {
        fill: true,
        text: '塗りスタイル',
      },
    })

    expect(wrapper.classes()).toContain('is-fill')
  })

  it('renders title and message text correctly', () => {
    const wrapper = mountNote({
      props: {
        title: '重要な通知',
        text: '詳細な内容です。',
      },
    })

    expect(wrapper.find('.note-title').text()).toBe('重要な通知')
    expect(wrapper.find('.note-message').text()).toBe('詳細な内容です。')
  })

  it('renders custom slots over props', () => {
    const wrapper = mountNote({
      props: {
        title: 'デフォルトタイトル',
        text: 'デフォルトテキスト',
      },
      slots: {
        title: 'カスタムタイトル',
        default: '<a href="/test" class="custom-link">カスタムリンク</a>',
      },
    })

    expect(wrapper.find('.note-title').text()).toBe('カスタムタイトル')
    expect(wrapper.find('.custom-link').exists()).toBe(true)
  })

  it('renders inline action button and triggers callback', async () => {
    const handleAction = vi.fn()
    const wrapper = mountNote({
      props: {
        text: 'アクション付き通知',
        action: {
          label: '設定へ移動',
          onClick: handleAction,
        },
      },
    })

    const actionBtn = wrapper.find('.btn-stub')

    expect(actionBtn.exists()).toBe(true)
    expect(actionBtn.text()).toBe('設定へ移動')

    await actionBtn.trigger('click')
    expect(handleAction).toHaveBeenCalledTimes(1)
  })

  it('does not have pure accessibility attributes (aria-*, role)', () => {
    const wrapper = mountNote({
      props: {
        text: 'アクセシビリティ検証',
      },
    })

    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-live')).toBeUndefined()
  })
})
