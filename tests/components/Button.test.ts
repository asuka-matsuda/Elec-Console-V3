import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Button from '../../app/components/common/atoms/Button.vue'

describe('Button.vue', () => {
  it('renders default button with type="button" and btn--default', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'テストボタン',
      },
      global: {
        stubs: {
          Icon: true,
          NuxtLink: true,
        },
      },
    })

    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.classes()).toContain('btn--default')
    expect(wrapper.text()).toBe('テストボタン')
  })

  it('renders success and danger variants properly', () => {
    const wrapperSuccess = mount(Button, {
      props: { variant: 'success' },
      global: { stubs: { Icon: true, NuxtLink: true } },
    })

    expect(wrapperSuccess.classes()).toContain('btn--success')

    const wrapperDanger = mount(Button, {
      props: { variant: 'danger' },
      global: { stubs: { Icon: true, NuxtLink: true } },
    })

    expect(wrapperDanger.classes()).toContain('btn--danger')
  })

  it('renders icon correctly', () => {
    const wrapper = mount(Button, {
      props: {
        icon: 'plus',
      },
      slots: {
        default: '追加',
      },
      global: {
        stubs: {
          Icon: {
            props: ['name'],
            template: '<i :data-name="name" class="stub-icon" />',
          },
          NuxtLink: true,
        },
      },
    })

    const icon = wrapper.find('.stub-icon')

    expect(icon.exists()).toBe(true)
    expect(icon.attributes('data-name')).toBe('plus')
  })

  it('handles loading state with spinner and disabled behavior', () => {
    const wrapper = mount(Button, {
      props: {
        loading: true,
        icon: 'check',
      },
      slots: {
        default: '保存中',
      },
      global: {
        stubs: {
          Icon: {
            props: ['name'],
            template: '<i :data-name="name" class="stub-icon" />',
          },
          NuxtLink: true,
        },
      },
    })

    expect(wrapper.classes()).toContain('is-loading')
    expect(wrapper.attributes('disabled')).toBeDefined()

    const spinner = wrapper.find('.absolute .stub-icon')

    expect(spinner.exists()).toBe(true)
    expect(spinner.attributes('data-name')).toBe('loader')
  })

  it('renders as NuxtLink when to or href is provided, and falls back to button when disabled', () => {
    const wrapperLink = mount(Button, {
      props: {
        to: '/portal/dashboard',
      },
      global: {
        stubs: {
          Icon: true,
          NuxtLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    })

    expect(wrapperLink.find('a').exists()).toBe(true)
    expect(wrapperLink.find('a').attributes('href')).toBe('/portal/dashboard')

    // disabled 時は安全に <button disabled> にフォールバック
    const wrapperDisabledLink = mount(Button, {
      props: {
        to: '/portal/dashboard',
        disabled: true,
      },
      global: {
        stubs: {
          Icon: true,
          NuxtLink: true,
        },
      },
    })

    expect(wrapperDisabledLink.find('button').exists()).toBe(true)
    expect(wrapperDisabledLink.attributes('disabled')).toBeDefined()
    expect(wrapperDisabledLink.attributes('type')).toBe('button')
  })

  it('sets btn--icon automatically when icon is provided without default slot', () => {
    const wrapper = mount(Button, {
      props: {
        icon: 'menu',
      },
      global: {
        stubs: {
          Icon: true,
          NuxtLink: true,
        },
      },
    })

    expect(wrapper.classes()).toContain('btn--icon')
  })

  it('renders title attribute correctly', () => {
    const wrapper = mount(Button, {
      props: {
        icon: 'plus',
        title: 'タスクを追加',
      },
      global: {
        stubs: {
          Icon: true,
          NuxtLink: true,
        },
      },
    })

    expect(wrapper.attributes('title')).toBe('タスクを追加')
  })

  it('overlays loader spinner when loading is true', () => {
    const wrapper = mount(Button, {
      props: {
        icon: 'save',
        loading: true,
      },
      slots: {
        default: '保存',
      },
      global: {
        stubs: {
          Icon: {
            props: ['name'],
            template: '<i :data-name="name" class="stub-icon" />',
          },
          NuxtLink: true,
        },
      },
    })

    const spinner = wrapper.find('.absolute .stub-icon')

    expect(spinner.exists()).toBe(true)
    expect(spinner.attributes('data-name')).toBe('loader')
  })
})
