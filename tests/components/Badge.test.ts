import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Badge from '../../app/components/common/atoms/Badge.vue'

describe('Badge.vue', () => {
  it('デフォルトのカラー変数とスロット内容を正しく描画する', () => {
    const wrapper = mount(Badge, {
      slots: {
        default: 'テストバッジ',
      },
    })

    expect(wrapper.classes()).toContain('badge')
    expect(wrapper.text()).toBe('テストバッジ')
    expect(wrapper.attributes('style')).toContain('--glow-color: var(--color-text-muted)')
  })

  it('カスタムカラーが指定された場合に --glow-color スタイルが反映される', () => {
    const wrapper = mount(Badge, {
      props: {
        color: 'var(--color-status-success)',
      },
      slots: {
        default: '完了',
      },
    })

    expect(wrapper.text()).toBe('完了')
    expect(wrapper.attributes('style')).toContain('--glow-color: var(--color-status-success)')
  })

  it('任意のCSSカラー文字列が指定された場合も正しく反映される', () => {
    const wrapper = mount(Badge, {
      props: {
        color: '#ff0000',
      },
      slots: {
        default: 'アラート',
      },
    })

    expect(wrapper.attributes('style')).toContain('--glow-color: #ff0000')
  })

  it('プリセットIDが指定された場合に設定ファイルのカラーとデフォルトラベルが反映される', () => {
    const wrapper = mount(Badge, {
      props: {
        id: 'role:admin',
      },
    })

    expect(wrapper.text()).toBe('管理者')
    expect(wrapper.attributes('style')).toContain('--glow-color: var(--color-role-admin)')
  })

  it('プリセットIDが指定されていてもスロット内容が優先される', () => {
    const wrapper = mount(Badge, {
      props: {
        id: 'role:admin',
      },
      slots: {
        default: '特別管理者',
      },
    })

    expect(wrapper.text()).toBe('特別管理者')
    expect(wrapper.attributes('style')).toContain('--glow-color: var(--color-role-admin)')
  })

  it('プリセットIDとcolorプロパティが両方渡された場合はcolorが優先される', () => {
    const wrapper = mount(Badge, {
      props: {
        id: 'role:admin',
        color: '#00ff00',
      },
    })

    expect(wrapper.text()).toBe('管理者')
    expect(wrapper.attributes('style')).toContain('--glow-color: #00ff00')
  })
})
