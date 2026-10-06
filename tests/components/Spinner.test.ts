import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Spinner from '../../app/components/common/atoms/Spinner.vue'

describe('Spinner (Geist Loading Indicator)', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(Spinner)

    expect(wrapper.classes()).toContain('geist-spinner')

    const bars = wrapper.findAll('.spinner-bar')

    expect(bars.length).toBe(12)
    expect(wrapper.attributes('style')).toContain('--spinner-size: 24px')
  })

  it('renders predefined sizes correctly (sm, md, lg)', () => {
    const wrapperSm = mount(Spinner, { props: { size: 'sm' } })

    expect(wrapperSm.attributes('style')).toContain('--spinner-size: 16px')

    const wrapperMd = mount(Spinner, { props: { size: 'md' } })

    expect(wrapperMd.attributes('style')).toContain('--spinner-size: 24px')

    const wrapperLg = mount(Spinner, { props: { size: 'lg' } })

    expect(wrapperLg.attributes('style')).toContain('--spinner-size: 32px')
  })

  it('supports custom numeric pixel size', () => {
    const wrapper = mount(Spinner, { props: { size: 48 } })

    expect(wrapper.attributes('style')).toContain('--spinner-size: 48px')
  })

  it('applies custom color when provided', () => {
    const wrapper = mount(Spinner, { props: { color: 'var(--theme-accent)' } })

    expect(wrapper.attributes('style')).toContain('--spinner-color: var(--theme-accent)')
  })

  it('renders label via prop and slot', () => {
    const wrapperProp = mount(Spinner, { props: { label: '読み込み中...' } })

    expect(wrapperProp.find('.spinner-label').text()).toBe('読み込み中...')

    const wrapperSlot = mount(Spinner, {
      slots: { default: '同期中...' },
    })

    expect(wrapperSlot.find('.spinner-label').text()).toBe('同期中...')
  })

  it('configures 12 radiating bars with sequential delays', () => {
    const wrapper = mount(Spinner)
    const bars = wrapper.findAll('.spinner-bar')

    // 1本目: 0deg, -1.2s
    expect(bars[0].attributes('style')).toContain('rotate(0deg)')
    expect(bars[0].attributes('style')).toContain('animation-delay: -1.2s')

    // 2本目: 30deg, -1.1s
    expect(bars[1].attributes('style')).toContain('rotate(30deg)')
    expect(bars[1].attributes('style')).toContain('animation-delay: -1.1s')

    // 12本目: 330deg, -0.1s
    expect(bars[11].attributes('style')).toContain('rotate(330deg)')
    expect(bars[11].attributes('style')).toContain('animation-delay: -0.1s')
  })
})
