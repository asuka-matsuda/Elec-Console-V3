import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Banner from '../../app/components/common/atoms/Banner.vue'

describe('Banner.vue', () => {
  it('renders default banner with variant="gray"', () => {
    const wrapper = mount(Banner, {
      props: {
        title: '情報バナー',
      },
      global: {
        stubs: {
          Icon: true,
          Tooltip: true,
          Button: true,
        },
      },
    })

    expect(wrapper.classes()).toContain('banner')
    expect(wrapper.classes()).toContain('banner--gray')
    expect(wrapper.text()).toContain('情報バナー')
    expect(wrapper.find('.banner-close').exists()).toBe(false)
  })

  it('renders title and sub text correctly', () => {
    const wrapper = mount(Banner, {
      props: {
        variant: 'warning',
        title: '圏外で動作中',
        sub: '端末に一時保存されます',
      },
      global: {
        stubs: {
          Icon: true,
          Tooltip: true,
          Button: true,
        },
      },
    })

    expect(wrapper.classes()).toContain('banner--warning')
    expect(wrapper.find('.banner-title').text()).toBe('圏外で動作中')
    expect(wrapper.find('.banner-sub').text()).toBe('端末に一時保存されます')
  })

  it('renders default slot content', () => {
    const wrapper = mount(Banner, {
      slots: {
        default: '<span class="custom-content">カスタム告知</span>',
      },
      global: {
        stubs: {
          Icon: true,
          Tooltip: true,
          Button: true,
        },
      },
    })

    expect(wrapper.find('.custom-content').text()).toBe('カスタム告知')
  })

  it('renders action slot and dismiss button when dismissible is true', async () => {
    const wrapper = mount(Banner, {
      props: {
        dismissible: true,
      },
      slots: {
        action: '<button class="action-btn">再試行</button>',
      },
      global: {
        stubs: {
          Icon: true,
          Tooltip: { template: '<div><slot /></div>' },
          Button: {
            template: '<button class="banner-close"></button>',
          },
        },
      },
    })

    expect(wrapper.find('.action-btn').exists()).toBe(true)

    const closeBtn = wrapper.find('.banner-close')

    expect(closeBtn.exists()).toBe(true)

    await closeBtn.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('close')?.length).toBe(1)
  })
})
