import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MoleculesResultBox from '../../app/components/MoleculesResultBox.vue'

describe('MoleculesResultBox.vue', () => {
  it('renders title and default slot value', () => {
    const wrapper = mount(MoleculesResultBox, {
      props: { title: '電線サイズ' },
      slots: { default: '5.5 mm²' },
    })

    expect(wrapper.text()).toContain('電線サイズ')
    expect(wrapper.text()).toContain('5.5 mm²')
    expect(wrapper.find('.result-box').classes()).toContain('is-neutral')
  })

  it('applies status class correctly', () => {
    const wrapper = mount(MoleculesResultBox, {
      props: { status: 'success' },
      slots: { default: '100 V' },
    })

    expect(wrapper.find('.result-box').classes()).toContain('is-success')
  })

  it('normalizes error to danger status', () => {
    const wrapper = mount(MoleculesResultBox, {
      props: { status: 'error' },
      slots: { default: 'NG' },
    })

    expect(wrapper.find('.result-box').classes()).toContain('is-danger')
  })

  it('applies is-empty when isEmpty is true', () => {
    const wrapper = mount(MoleculesResultBox, {
      props: { isEmpty: true },
      slots: { default: '-' },
    })

    expect(wrapper.find('.result-box').classes()).toContain('is-empty')
  })

  it('displays badge for warning or danger status, but hides for success', () => {
    // warning の場合はバッジを表示
    const wrapperWarning = mount(MoleculesResultBox, {
      props: {
        status: 'warning',
        badge: '許容電流注意',
      },
    })

    expect(wrapperWarning.text()).toContain('許容電流注意')

    // danger の場合はバッジを表示
    const wrapperDanger = mount(MoleculesResultBox, {
      props: {
        status: 'danger',
        badge: '許容電流不足',
      },
    })

    expect(wrapperDanger.text()).toContain('許容電流不足')

    // success の場合はバッジを非表示
    const wrapperSuccess = mount(MoleculesResultBox, {
      props: {
        status: 'success',
        badge: 'OK',
      },
    })

    expect(wrapperSuccess.text()).not.toContain('OK')
  })
})
