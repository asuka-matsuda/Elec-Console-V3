import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PortalAtomKairoSymbol from '../../app/components/portal/AtomKairoSymbol.vue'

describe('PortalAtomKairoSymbol.vue', () => {
  it('renders circle path when kigou is "丸" or "○"', () => {
    const wrapper = mount(PortalAtomKairoSymbol, {
      props: { kigou: '丸', bangou: '1' },
    })

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('path').length).toBe(1)
    expect(wrapper.text()).toBe('1')
  })

  it('renders double circle paths when kigou is "二重丸" or "◎"', () => {
    const wrapper = mount(PortalAtomKairoSymbol, {
      props: { kigou: '◎', bangou: 2 },
    })

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('path').length).toBe(2)
    expect(wrapper.text()).toBe('2')
  })

  it('renders ellipse path when kigou is "楕円"', () => {
    const wrapper = mount(PortalAtomKairoSymbol, {
      props: { kigou: '楕円', bangou: '3' },
    })

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('path').length).toBe(1)
    expect(wrapper.text()).toBe('3')
  })

  it('renders double ellipse paths when kigou is "二重楕円"', () => {
    const wrapper = mount(PortalAtomKairoSymbol, {
      props: { kigou: '二重楕円', bangou: '4' },
    })

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('path').length).toBe(2)
    expect(wrapper.text()).toBe('4')
  })

  it('renders rect path when kigou is "四角" or "□"', () => {
    const wrapper = mount(PortalAtomKairoSymbol, {
      props: { kigou: '□', bangou: '5' },
    })

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('path').length).toBe(1)
    expect(wrapper.text()).toBe('5')
  })

  it('renders double rect paths when kigou is "二重四角"', () => {
    const wrapper = mount(PortalAtomKairoSymbol, {
      props: { kigou: '二重四角', bangou: '6' },
    })

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('path').length).toBe(2)
    expect(wrapper.text()).toBe('6')
  })

  it('renders plain text without SVG when kigou is empty or unrecognized', () => {
    const wrapper = mount(PortalAtomKairoSymbol, {
      props: { kigou: null, bangou: '7' },
    })

    expect(wrapper.find('svg').exists()).toBe(false)
    expect(wrapper.text()).toBe('7')
  })

  it('renders fallback dash when bangou is null or empty', () => {
    const wrapper = mount(PortalAtomKairoSymbol, {
      props: { kigou: '丸', bangou: null },
    })

    expect(wrapper.text()).toBe('-')
  })

  it('sets title tooltip correctly', () => {
    const wrapper = mount(PortalAtomKairoSymbol, {
      props: { kigou: '丸', bangou: '10' },
    })

    expect(wrapper.attributes('title')).toBe('丸 10')
  })
})
