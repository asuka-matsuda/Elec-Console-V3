import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Heading from '~/components/common/atoms/Heading.vue'

describe('Heading.vue', () => {
  it('renders default level 2 heading with 2xl size', () => {
    const wrapper = mount(Heading, {
      slots: {
        default: 'テスト見出し',
      },
    })

    expect(wrapper.element.tagName).toBe('H2')
    expect(wrapper.classes()).toContain('is-2xl')
    expect(wrapper.text()).toBe('テスト見出し')
  })

  it('renders specified level and auto sizes correctly', () => {
    const wrapper1 = mount(Heading, {
      props: { level: 1 },
      slots: { default: 'H1タイトル' },
    })

    expect(wrapper1.element.tagName).toBe('H1')
    expect(wrapper1.classes()).toContain('is-3xl')

    const wrapper3 = mount(Heading, {
      props: { level: 3 },
      slots: { default: 'H3タイトル' },
    })

    expect(wrapper3.element.tagName).toBe('H3')
    expect(wrapper3.classes()).toContain('is-xl')

    const wrapper4 = mount(Heading, {
      props: { level: 'h4' },
      slots: { default: 'H4タイトル' },
    })

    expect(wrapper4.element.tagName).toBe('H4')
    expect(wrapper4.classes()).toContain('is-lg')
  })

  it('respects tag prop as alias to level', () => {
    const wrapper = mount(Heading, {
      props: { tag: 'h3' },
      slots: { default: 'Tag Props テスト' },
    })

    expect(wrapper.element.tagName).toBe('H3')
    expect(wrapper.classes()).toContain('is-xl')
  })

  it('allows overriding size independently of level', () => {
    const wrapper = mount(Heading, {
      props: { level: 2, size: 'base' },
      slots: { default: 'カスタムサイズ' },
    })

    expect(wrapper.element.tagName).toBe('H2')
    expect(wrapper.classes()).toContain('is-base')
  })

  it('supports non-heading tags such as div or p without prefixing with h', () => {
    const wrapper = mount(Heading, {
      props: { tag: 'div', size: 'xl' },
      slots: { default: 'Div 見出し' },
    })

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.classes()).toContain('is-xl')
  })
})
