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

  it('renders footer slot when provided', () => {
    const wrapper = mount(MoleculesResultBox, {
      slots: {
        default: '48%',
        footer: '<span class="test-footer">推奨範囲内</span>',
      },
    })

    expect(wrapper.find('.test-footer').exists()).toBe(true)
    expect(wrapper.find('.test-footer').text()).toBe('推奨範囲内')
  })
})
