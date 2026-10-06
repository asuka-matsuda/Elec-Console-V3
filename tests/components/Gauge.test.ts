import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Gauge from '../../app/components/common/atoms/Gauge.vue'

describe('Gauge.vue', () => {
  it('renders SVG tracks correctly with default props', () => {
    const wrapper = mount(Gauge, {
      props: {
        value: 50,
      },
    })

    const svg = wrapper.find('svg.gauge-svg')

    expect(svg.exists()).toBe(true)

    const track = wrapper.find('circle.gauge-track')

    expect(track.exists()).toBe(true)

    const fill = wrapper.find('circle.gauge-fill')

    expect(fill.exists()).toBe(true)

    // デフォルト md サイズでは 50% と表示される
    expect(wrapper.find('.gauge-number').text()).toBe('50')
    expect(wrapper.find('.gauge-unit').text()).toBe('%')
  })

  it('calculates custom min and max correctly', () => {
    const wrapper = mount(Gauge, {
      props: {
        value: 150,
        min: 100,
        max: 200,
      },
    })

    // 100〜200 の範囲で 150 は 50%
    expect(wrapper.find('.gauge-number').text()).toBe('50')
  })

  it('hides text when size is tiny', () => {
    const wrapper = mount(Gauge, {
      props: {
        value: 50,
        size: 'tiny',
      },
    })

    expect(wrapper.classes()).toContain('is-tiny')
    expect(wrapper.find('.gauge-content').exists()).toBe(false)
  })

  it('hides text when showValue is false', () => {
    const wrapper = mount(Gauge, {
      props: {
        value: 50,
        size: 'md',
        showValue: false,
      },
    })

    expect(wrapper.find('.gauge-content').exists()).toBe(false)
  })

  it('renders label inside content on md and lg sizes', () => {
    const wrapper = mount(Gauge, {
      props: {
        value: 75,
        size: 'md',
        label: 'CPU使用率',
      },
    })

    expect(wrapper.find('.gauge-label').text()).toBe('CPU使用率')
    expect(wrapper.find('.gauge-sublabel').exists()).toBe(false)
  })

  it('renders label below on sm and tiny sizes', () => {
    const wrapper = mount(Gauge, {
      props: {
        value: 75,
        size: 'sm',
        label: 'メモリ',
      },
    })

    expect(wrapper.find('.gauge-sublabel').text()).toBe('メモリ')
  })

  it('applies explicit color variant', () => {
    const wrapper = mount(Gauge, {
      props: {
        value: 20,
        variant: 'danger',
      },
    })

    expect(wrapper.attributes('style')).toContain('--gauge-fg: var(--color-status-danger)')
  })

  it('applies custom color prop', () => {
    const wrapper = mount(Gauge, {
      props: {
        value: 20,
        color: '#ff00ff',
      },
    })

    expect(wrapper.attributes('style')).toContain('--gauge-fg: #ff00ff')
  })

  it('applies default Geist color scale based on value', () => {
    // 0-59%: theme-accent
    const wrapperLow = mount(Gauge, { props: { value: 30 } })

    expect(wrapperLow.attributes('style')).toContain('--gauge-fg: var(--theme-accent)')

    // 60-89%: warning
    const wrapperMid = mount(Gauge, { props: { value: 75 } })

    expect(wrapperMid.attributes('style')).toContain('--gauge-fg: var(--color-status-warning)')

    // 90-100%: success
    const wrapperHigh = mount(Gauge, { props: { value: 95 } })

    expect(wrapperHigh.attributes('style')).toContain('--gauge-fg: var(--color-status-success)')
  })

  it('does not contain accessibility attributes (local/no-pure-accessibility compliance)', () => {
    const wrapper = mount(Gauge, {
      props: {
        value: 50,
      },
    })

    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-valuenow')).toBeUndefined()
    expect(wrapper.attributes('aria-valuemin')).toBeUndefined()
    expect(wrapper.attributes('aria-valuemax')).toBeUndefined()

    const svg = wrapper.find('svg')

    expect(svg.attributes('role')).toBeUndefined()
  })
})
