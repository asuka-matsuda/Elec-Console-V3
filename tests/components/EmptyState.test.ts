import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import EmptyState from '../../app/components/common/molecules/EmptyState.vue'

describe('EmptyState.vue', () => {
  const commonStubs = {
    Icon: {
      props: ['name', 'size', 'spin'],
      template: '<span class="icon-stub" :data-icon="name" :data-spin="spin">{{ name }}</span>',
    },
  }

  it('renders title, icon, and description correctly', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'データがありません',
        description: '検索条件を変更してお試しください。',
        icon: 'database',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('データがありません')
    expect(wrapper.text()).toContain('検索条件を変更してお試しください。')
    expect(wrapper.find('.icon-stub').attributes('data-icon')).toBe('database')

    const titleEl = wrapper.find('.title')

    expect(titleEl.exists()).toBe(true)
    expect(titleEl.element.tagName.toLowerCase()).toBe('p')

    const descEl = wrapper.find('.desc')

    expect(descEl.exists()).toBe(true)
    expect(descEl.element.tagName.toLowerCase()).toBe('p')
  })

  it('handles spin prop correctly on Icon', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: '読み込み中...',
        icon: 'loader',
        spin: true,
      },
      global: {
        stubs: commonStubs,
      },
    })

    const iconStub = wrapper.find('.icon-stub')

    expect(iconStub.exists()).toBe(true)
    expect(iconStub.attributes('data-spin')).toBe('true')
  })

  it('renders actions slot content correctly', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: '登録なし',
      },
      slots: {
        actions: '<button class="action-btn">新規作成</button>',
      },
      global: {
        stubs: commonStubs,
      },
    })

    const button = wrapper.find('.action-btn')

    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('新規作成')
  })

  it('does not render title, desc, or icon when props are omitted', () => {
    const wrapper = mount(EmptyState, {
      props: {},
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('.icon-stub').exists()).toBe(false)
    expect(wrapper.find('.title').exists()).toBe(false)
    expect(wrapper.find('.desc').exists()).toBe(false)
    expect(wrapper.exists()).toBe(true)
  })
})
