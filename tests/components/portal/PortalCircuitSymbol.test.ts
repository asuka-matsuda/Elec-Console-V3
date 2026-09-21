import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PortalCircuitSymbol from '../../../app/components/portal/atoms/CircuitSymbol.vue'

describe('PortalCircuitSymbol.vue', () => {
  it('renders bangou text correctly', () => {
    const wrapper = mount(PortalCircuitSymbol, {
      props: {
        bangou: '12',
      },
    })

    expect(wrapper.text()).toBe('12')
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('renders hyphen when bangou is empty or null', () => {
    const wrapper = mount(PortalCircuitSymbol, {
      props: {
        bangou: null,
      },
    })

    expect(wrapper.text()).toBe('-')
  })

  it('renders single circle SVG when kigou is "丸"', () => {
    const wrapper = mount(PortalCircuitSymbol, {
      props: {
        kigou: '丸',
        bangou: '1',
      },
    })

    expect(wrapper.text()).toBe('1')
    const svg = wrapper.find('svg')

    expect(svg.exists()).toBe(true)
    const circles = svg.findAll('circle')

    expect(circles.length).toBe(1)
  })

  it('renders double circle SVG when kigou is "◎"', () => {
    const wrapper = mount(PortalCircuitSymbol, {
      props: {
        kigou: '◎',
        bangou: '2',
      },
    })

    const svg = wrapper.find('svg')

    expect(svg.exists()).toBe(true)
    const circles = svg.findAll('circle')

    expect(circles.length).toBe(2)
  })

  it('renders rect SVG when kigou is "四角"', () => {
    const wrapper = mount(PortalCircuitSymbol, {
      props: {
        kigou: '四角',
        bangou: '3',
      },
    })

    const svg = wrapper.find('svg')

    expect(svg.exists()).toBe(true)
    const rects = svg.findAll('rect')

    expect(rects.length).toBe(1)
  })

  it('renders double rect SVG when kigou is "二重四角"', () => {
    const wrapper = mount(PortalCircuitSymbol, {
      props: {
        kigou: '二重四角',
        bangou: '4',
      },
    })

    const svg = wrapper.find('svg')

    expect(svg.exists()).toBe(true)
    const rects = svg.findAll('rect')

    expect(rects.length).toBe(2)
  })

  it('renders ellipse SVG when kigou is "楕円"', () => {
    const wrapper = mount(PortalCircuitSymbol, {
      props: {
        kigou: '楕円',
        bangou: '5',
      },
    })

    const svg = wrapper.find('svg')

    expect(svg.exists()).toBe(true)
    const ellipses = svg.findAll('ellipse')

    expect(ellipses.length).toBe(1)
  })

  it('renders polygon SVG when kigou is "三角"', () => {
    const wrapper = mount(PortalCircuitSymbol, {
      props: {
        kigou: '三角',
        bangou: '6',
      },
    })

    const svg = wrapper.find('svg')

    expect(svg.exists()).toBe(true)
    const polygons = svg.findAll('polygon')

    expect(polygons.length).toBe(1)
  })

  it('renders only text when kigou is unknown', () => {
    const wrapper = mount(PortalCircuitSymbol, {
      props: {
        kigou: '未知の記号',
        bangou: '99',
      },
    })

    expect(wrapper.text()).toBe('99')
    expect(wrapper.find('svg').exists()).toBe(false)
  })
})
