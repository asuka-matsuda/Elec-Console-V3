import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ResultBox from '../../app/components/common/molecules/ResultBox.vue'

describe('ResultBox.vue', () => {
  it('renders title and default slot value correctly', () => {
    const wrapper = mount(ResultBox, {
      props: { title: '電線サイズ' },
      slots: { default: '5.5 mm²' },
    })

    expect(wrapper.text()).toContain('電線サイズ')
    expect(wrapper.text()).toContain('5.5 mm²')
    expect(wrapper.find('.result-box').classes()).toContain('is-neutral')
  })

  it('applies status class correctly', () => {
    const wrapper = mount(ResultBox, {
      props: { status: 'success' },
      slots: { default: '100 V' },
    })

    expect(wrapper.find('.result-box').classes()).toContain('is-success')
  })

  it('applies is-empty when isEmpty is true or status is empty', () => {
    const wrapperProp = mount(ResultBox, {
      props: { isEmpty: true },
      slots: { default: '-' },
    })

    expect(wrapperProp.find('.result-box').classes()).toContain('is-empty')

    const wrapperStatus = mount(ResultBox, {
      props: { status: 'empty' },
      slots: { default: '-' },
    })

    expect(wrapperStatus.find('.result-box').classes()).toContain('is-empty')
  })

  it('displays badge faithfully when badge prop is provided', () => {
    // warning 時のバッジ表示
    const wrapperWarning = mount(ResultBox, {
      props: {
        status: 'warning',
        badge: '許容電流注意',
      },
    })

    expect(wrapperWarning.text()).toContain('許容電流注意')

    // danger 時のバッジ表示
    const wrapperDanger = mount(ResultBox, {
      props: {
        status: 'danger',
        badge: '許容電流不足',
      },
    })

    expect(wrapperDanger.text()).toContain('許容電流不足')

    // success 時でも親が指定したバッジは素直に表示される（暗黙の非表示を排除）
    const wrapperSuccess = mount(ResultBox, {
      props: {
        status: 'success',
        badge: '適合',
      },
    })

    expect(wrapperSuccess.text()).toContain('適合')
  })

  it('supports custom value slot', () => {
    const wrapper = mount(ResultBox, {
      slots: {
        value: '<span class="custom-value">123</span>',
      },
    })

    expect(wrapper.find('.custom-value').text()).toBe('123')
  })
})
