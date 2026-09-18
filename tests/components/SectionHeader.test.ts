import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SectionHeader from '../../app/components/common/molecules/SectionHeader.vue'

describe('SectionHeader.vue', () => {
  it('renders default title with h2 tag', () => {
    const wrapper = mount(SectionHeader, {
      props: {
        title: 'テスト見出し',
      },
    })

    expect(wrapper.text()).toContain('テスト見出し')
    const heading = wrapper.find('h2.title')

    expect(heading.exists()).toBe(true)
  })

  it('renders specified heading tag when tag prop is passed', () => {
    const wrapperH3 = mount(SectionHeader, {
      props: {
        title: '中見出し',
        tag: 'h3',
      },
    })

    expect(wrapperH3.find('h3.title').exists()).toBe(true)
    expect(wrapperH3.find('h2').exists()).toBe(false)

    const wrapperH4 = mount(SectionHeader, {
      props: {
        title: '小見出し',
        tag: 'h4',
      },
    })

    expect(wrapperH4.find('h4.title').exists()).toBe(true)

    const wrapperH1 = mount(SectionHeader, {
      props: {
        title: '主見出し',
        tag: 'h1',
      },
    })

    expect(wrapperH1.find('h1.title').exists()).toBe(true)
  })

  it('renders default slot instead of title prop when provided', () => {
    const wrapper = mount(SectionHeader, {
      slots: {
        default: '<span class="custom-slot">カスタム見出し</span>',
      },
    })

    expect(wrapper.find('.custom-slot').text()).toBe('カスタム見出し')
  })

  it('renders actions slot when provided', () => {
    const wrapper = mount(SectionHeader, {
      props: {
        title: '見出し',
      },
      slots: {
        actions: '<button class="action-btn">追加</button>',
      },
    })

    expect(wrapper.find('.action-btn').exists()).toBe(true)
  })

  it('passes animated=true and theme accent color to divider by default', () => {
    const wrapper = mount(SectionHeader, {
      props: {
        title: '見出し',
      },
    })

    const divider = wrapper.find('hr')

    expect(divider.exists()).toBe(true)
    expect(divider.classes()).toContain('is-animated')
    expect(divider.attributes('style')).toContain('--divider-color: var(--theme-accent)')
  })

  it('passes animated=false and border color to divider when variant="border" or "hud"', () => {
    const wrapperBorder = mount(SectionHeader, {
      props: {
        title: '境界見出し',
        variant: 'border',
      },
    })

    const dividerBorder = wrapperBorder.find('hr')

    expect(dividerBorder.exists()).toBe(true)
    expect(dividerBorder.classes()).not.toContain('is-animated')
    expect(dividerBorder.attributes('style')).toContain('--divider-color: var(--color-border)')

    const wrapperHud = mount(SectionHeader, {
      props: {
        title: 'HUD見出し',
        variant: 'hud',
      },
    })

    const dividerHud = wrapperHud.find('hr')

    expect(dividerHud.exists()).toBe(true)
    expect(dividerHud.classes()).not.toContain('is-animated')
    expect(dividerHud.attributes('style')).toContain('--divider-color: var(--color-border)')
  })
})
