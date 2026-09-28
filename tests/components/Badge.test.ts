import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Badge from '../../app/components/common/atoms/Badge.vue'

describe('Badge.vue', () => {
  it('renders slot content correctly without color prop', () => {
    const wrapper = mount(Badge, {
      slots: {
        default: 'テストバッジ',
      },
    })

    const span = wrapper.find('span.badge')

    expect(span.exists()).toBe(true)
    expect(span.text()).toBe('テストバッジ')
    expect(span.attributes('style')).toBeUndefined()
  })

  it('applies --glow-color CSS variable when color prop is provided', () => {
    const wrapper = mount(Badge, {
      props: {
        color: 'var(--color-status-success)',
      },
      slots: {
        default: '完了',
      },
    })

    const span = wrapper.find('span.badge')

    expect(span.exists()).toBe(true)
    expect(span.text()).toBe('完了')
    expect(span.attributes('style')).toContain('--glow-color: var(--color-status-success)')
  })
})
