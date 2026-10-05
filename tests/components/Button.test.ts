import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Button from '../../app/components/common/atoms/Button.vue'

describe('Button.vue', () => {
  it('renders default button with type="button", btn--secondary, and btn--md', () => {
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
    expect(wrapper.classes()).toContain('btn--secondary')
    expect(wrapper.classes()).toContain('btn--md')
    expect(wrapper.text()).toBe('テストボタン')
  })

  it('renders Geist variants properly (primary, secondary, tertiary, danger, warning)', () => {
    const variants = ['primary', 'secondary', 'tertiary', 'danger', 'warning'] as const

    for (const variant of variants) {
      const wrapper = mount(Button, {
        props: { variant },
        global: { stubs: { Icon: true, NuxtLink: true } },
      })

      expect(wrapper.classes()).toContain(`btn--${variant}`)
    }
  })

  it('renders Geist sizes properly (sm, md, lg)', () => {
    const sizes = ['sm', 'md', 'lg'] as const

    for (const size of sizes) {
      const wrapper = mount(Button, {
        props: { size },
        global: { stubs: { Icon: true, NuxtLink: true } },
      })

      expect(wrapper.classes()).toContain(`btn--${size}`)
    }
  })

  it('synchronizes icon size according to button size constraint', () => {
    // sm -> icon size sm
    const wrapperSm = mount(Button, {
      props: { size: 'sm', icon: 'plus' },
      slots: { default: '追加' },
      global: {
        stubs: {
          Icon: {
            props: ['name', 'size'],
            template: '<i :data-name="name" :data-size="size" class="stub-icon" />',
          },
          NuxtLink: true,
        },
      },
    })

    expect(wrapperSm.find('.stub-icon').attributes('data-size')).toBe('sm')

    // lg -> icon size lg
    const wrapperLg = mount(Button, {
      props: { size: 'lg', icon: 'plus' },
      slots: { default: '追加' },
      global: {
        stubs: {
          Icon: {
            props: ['name', 'size'],
            template: '<i :data-name="name" :data-size="size" class="stub-icon" />',
          },
          NuxtLink: true,
        },
      },
    })

    expect(wrapperLg.find('.stub-icon').attributes('data-size')).toBe('lg')
  })

  it('renders prefix icon and suffixIcon correctly', () => {
    const wrapper = mount(Button, {
      props: {
        icon: 'plus',
        suffixIcon: 'arrow-right',
      },
      slots: {
        default: '次へ進む',
      },
      global: {
        stubs: {
          Icon: {
            props: ['name', 'size'],
            template: '<i :data-name="name" class="stub-icon" />',
          },
          NuxtLink: true,
        },
      },
    })

    const icons = wrapper.findAll('.stub-icon')

    expect(icons).toHaveLength(2)
    expect(icons[0].attributes('data-name')).toBe('plus')
    expect(icons[1].attributes('data-name')).toBe('arrow-right')
  })

  it('sets btn--block when block prop is true', () => {
    const wrapper = mount(Button, {
      props: { block: true },
      global: { stubs: { Icon: true, NuxtLink: true } },
    })

    expect(wrapper.classes()).toContain('btn--block')
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

  it('renders as NuxtLink when to is provided, and falls back to button when disabled', () => {
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
})
