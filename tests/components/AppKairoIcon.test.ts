import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AppKairoIcon from '../../app/components/AppKairoIcon.vue'

describe('AppKairoIcon.vue', () => {
  it('renders circle SVG when kigou is "丸" or "○"', () => {
    const wrapper = mount(AppKairoIcon, {
      props: { kigou: '丸', bangou: '1' },
    })

    expect(wrapper.classes()).toContain('has-symbol')
    expect(wrapper.find('circle').exists()).toBe(true)
    expect(wrapper.find('.c-kairo-icon__text').text()).toBe('1')
  })

  it('renders double circle SVG when kigou is "二重丸" or "◎"', () => {
    const wrapper = mount(AppKairoIcon, {
      props: { kigou: '◎', bangou: 2 },
    })

    expect(wrapper.classes()).toContain('has-symbol')
    expect(wrapper.findAll('circle').length).toBe(2)
    expect(wrapper.find('.c-kairo-icon__text').text()).toBe('2')
  })

  it('renders ellipse SVG when kigou is "楕円"', () => {
    const wrapper = mount(AppKairoIcon, {
      props: { kigou: '楕円', bangou: '3' },
    })

    expect(wrapper.find('ellipse').exists()).toBe(true)
    expect(wrapper.find('.c-kairo-icon__text').text()).toBe('3')
  })

  it('renders double ellipse SVG when kigou is "二重楕円"', () => {
    const wrapper = mount(AppKairoIcon, {
      props: { kigou: '二重楕円', bangou: '4' },
    })

    expect(wrapper.findAll('ellipse').length).toBe(2)
    expect(wrapper.find('.c-kairo-icon__text').text()).toBe('4')
  })

  it('renders rect SVG when kigou is "四角" or "□"', () => {
    const wrapper = mount(AppKairoIcon, {
      props: { kigou: '□', bangou: '5' },
    })

    expect(wrapper.find('rect').exists()).toBe(true)
    expect(wrapper.find('.c-kairo-icon__text').text()).toBe('5')
  })

  it('renders double rect SVG when kigou is "二重四角"', () => {
    const wrapper = mount(AppKairoIcon, {
      props: { kigou: '二重四角', bangou: '6' },
    })

    expect(wrapper.findAll('rect').length).toBe(2)
    expect(wrapper.find('.c-kairo-icon__text').text()).toBe('6')
  })

  it('renders plain text without SVG when kigou is empty or unrecognized', () => {
    const wrapper = mount(AppKairoIcon, {
      props: { kigou: null, bangou: '7' },
    })

    expect(wrapper.classes()).not.toContain('has-symbol')
    expect(wrapper.find('svg').exists()).toBe(false)
    expect(wrapper.find('.c-kairo-icon__text').text()).toBe('7')
  })

  it('renders fallback dash when bangou is null or empty', () => {
    const wrapper = mount(AppKairoIcon, {
      props: { kigou: '丸', bangou: null },
    })

    expect(wrapper.find('.c-kairo-icon__text').text()).toBe('-')
  })

  it('sets title tooltip correctly', () => {
    const wrapper = mount(AppKairoIcon, {
      props: { kigou: '丸', bangou: '10' },
    })

    expect(wrapper.attributes('title')).toBe('丸 10')
  })
})
