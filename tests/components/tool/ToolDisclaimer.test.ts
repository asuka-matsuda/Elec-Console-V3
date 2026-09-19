import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ToolDisclaimer from '../../../app/components/tool/Disclaimer.vue'

describe('ToolDisclaimer (app/components/tool/Disclaimer.vue)', () => {
  const commonGlobal = {
    stubs: {
      Icon: {
        props: ['name', 'size'],
        template: '<i class="icon-stub" :data-name="name" :data-size="size" />',
      },
    },
  }

  it('renders default disclaimer with items-start, default text, and alert-triangle icon', () => {
    const wrapper = mount(ToolDisclaimer, {
      global: commonGlobal,
    })

    expect(wrapper.classes()).toContain('disclaimer')
    expect(wrapper.classes()).toContain('items-start')

    const icon = wrapper.find('.icon-stub')

    expect(icon.exists()).toBe(true)
    expect(icon.attributes('data-name')).toBe('alert-triangle')
    expect(icon.attributes('data-size')).toBeUndefined()
    expect(icon.classes()).toContain('shrink-0')

    // strongタグは使用せず、通常のテキストとして描画されること
    expect(wrapper.find('strong').exists()).toBe(false)

    const p = wrapper.find('p')

    expect(p.classes()).toContain('min-w-0')
    expect(p.classes()).toContain('break-words')

    expect(wrapper.text()).toContain('免責事項: 本ツールによる計算結果は、規程に基づいた理論値（目安）です。')
  })

  it('renders custom text via text prop', () => {
    const wrapper = mount(ToolDisclaimer, {
      props: {
        text: '注意: これはテスト用のカスタム注記文言です。',
      },
      global: commonGlobal,
    })

    expect(wrapper.text()).toBe('注意: これはテスト用のカスタム注記文言です。')
  })

  it('renders custom body via default slot', () => {
    const wrapper = mount(ToolDisclaimer, {
      slots: {
        default: '<span class="custom-body">スロットによる注記本文</span>',
      },
      global: commonGlobal,
    })

    expect(wrapper.find('.custom-body').exists()).toBe(true)
    expect(wrapper.text()).toContain('スロットによる注記本文')
  })

  it('renders custom icon via icon slot', () => {
    const wrapper = mount(ToolDisclaimer, {
      slots: {
        icon: '<span class="my-custom-icon">CUSTOM_ICON</span>',
      },
      global: commonGlobal,
    })

    expect(wrapper.find('.icon-stub').exists()).toBe(false)
    expect(wrapper.find('.my-custom-icon').exists()).toBe(true)
    expect(wrapper.text()).toContain('CUSTOM_ICON')
  })
})
