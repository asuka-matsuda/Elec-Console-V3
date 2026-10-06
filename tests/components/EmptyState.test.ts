import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import EmptyState from '../../app/components/common/molecules/EmptyState.vue'

describe('EmptyState', () => {
  it('renders title, description, and icon correctly', () => {
    const wrapper = mount(EmptyState, {
      props: {
        icon: 'inbox',
        title: 'データがありません',
        description: '新しいアイテムを追加してください。',
      },
    })

    expect(wrapper.classes()).toContain('empty-state')
    expect(wrapper.find('.title').text()).toBe('データがありません')
    expect(wrapper.find('.desc').text()).toBe('新しいアイテムを追加してください。')
    expect(wrapper.find('.icon-surface').exists()).toBe(true)
  })

  it('applies variant classes correctly', () => {
    const variants = ['default', 'no-results', 'informational', 'cleared', 'permission', 'error'] as const

    for (const variant of variants) {
      const wrapper = mount(EmptyState, {
        props: {
          title: 'テストタイトル',
          variant,
        },
      })

      expect(wrapper.classes()).toContain(`is-${variant}`)
    }
  })

  it('applies size classes correctly', () => {
    const sizes = ['sm', 'md', 'lg'] as const

    for (const size of sizes) {
      const wrapper = mount(EmptyState, {
        props: {
          title: 'テストタイトル',
          size,
        },
      })

      expect(wrapper.classes()).toContain(`is-${size}`)
    }
  })

  it('applies is-bordered class when bordered prop is true', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: '枠線付き空状態',
        bordered: true,
      },
    })

    expect(wrapper.classes()).toContain('is-bordered')
  })

  it('renders custom content and actions via slots', () => {
    const wrapper = mount(EmptyState, {
      slots: {
        icon: '<span class="custom-icon">★</span>',
        title: '<strong class="custom-title">カスタムタイトル</strong>',
        description: '<span class="custom-desc">カスタム説明文</span>',
        actions: '<button class="action-btn">新規作成</button>',
      },
    })

    expect(wrapper.find('.custom-icon').exists()).toBe(true)
    expect(wrapper.find('.custom-title').text()).toBe('カスタムタイトル')
    expect(wrapper.find('.custom-desc').text()).toBe('カスタム説明文')
    expect(wrapper.find('.action-btn').exists()).toBe(true)
  })

  it('renders default slot inside actions area', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'デフォルトスロットのテスト',
      },
      slots: {
        default: '<button class="default-btn">実行する</button>',
      },
    })

    expect(wrapper.find('.actions').exists()).toBe(true)
    expect(wrapper.find('.default-btn').exists()).toBe(true)
  })
})
