import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Alert from '../../app/components/common/molecules/Alert.vue'

describe('Alert.vue', () => {
  const mountAlert = (options: Parameters<typeof mount>[1] = {}) => {
    return mount(Alert, {
      ...options,
      global: {
        stubs: {
          Icon: {
            props: ['name'],
            template: '<i class="icon-stub" :data-name="name" />',
          },
        },
        ...options.global,
      },
    })
  }

  it('デフォルトで variant="info" および info アイコンが設定される', () => {
    const wrapper = mountAlert({
      props: {
        text: '情報メッセージ',
      },
    })

    expect(wrapper.classes()).toContain('is-info')
    expect(wrapper.find('.icon-stub').attributes('data-name')).toBe('info')
    expect(wrapper.text()).toContain('情報メッセージ')
  })

  it('各 variant (info, success, warning, danger) に対応するクラスとデフォルトアイコンが設定される', () => {
    const variants = [
      { variant: 'info', icon: 'info', className: 'is-info' },
      { variant: 'success', icon: 'check', className: 'is-success' },
      { variant: 'warning', icon: 'triangle-alert', className: 'is-warning' },
      { variant: 'danger', icon: 'circle-alert', className: 'is-danger' },
    ] as const

    for (const { variant, icon, className } of variants) {
      const wrapper = mountAlert({
        props: { variant, text: 'テスト' },
      })

      expect(wrapper.classes()).toContain(className)
      expect(wrapper.find('.icon-stub').attributes('data-name')).toBe(icon)
    }
  })

  it('icon prop が指定された場合、variant のデフォルトアイコンをオーバーライドする', () => {
    const wrapper = mountAlert({
      props: {
        variant: 'warning',
        icon: 'bell',
        text: '注意',
      },
    })

    expect(wrapper.find('.icon-stub').attributes('data-name')).toBe('bell')
  })

  it('title が指定された場合にタイトルが表示される', () => {
    const wrapper = mountAlert({
      props: {
        title: '重要な通知',
        text: '詳細な内容です。',
      },
    })

    expect(wrapper.find('.alert-title').text()).toBe('重要な通知')
    expect(wrapper.find('.alert-message').text()).toBe('詳細な内容です。')
  })

  it('slot が指定された場合、text prop よりも slot の内容が優先される', () => {
    const wrapper = mountAlert({
      props: {
        text: 'デフォルトテキスト',
      },
      slots: {
        default: '<a href="/test" class="custom-link">リンクテキスト</a>',
      },
    })

    expect(wrapper.find('.custom-link').exists()).toBe(true)
    expect(wrapper.find('.custom-link').text()).toBe('リンクテキスト')
    expect(wrapper.text()).not.toContain('デフォルトテキスト')
  })
})
