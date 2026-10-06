import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Progress from '../../app/components/common/atoms/Progress.vue'

describe('Progress.vue', () => {
  it('renders track and fill elements with default props', () => {
    const wrapper = mount(Progress, {
      props: {
        value: 40,
      },
    })

    const track = wrapper.find('.progress-track')

    expect(track.exists()).toBe(true)
    expect(track.classes()).toContain('is-md')

    const fill = wrapper.find('.progress-fill')

    expect(fill.exists()).toBe(true)
    expect(fill.attributes('style')).toContain('width: 40%;')
    expect(track.attributes('style')).toContain('--progress-fg: var(--color-status-success)')
  })

  it('calculates custom max correctly', () => {
    const wrapper = mount(Progress, {
      props: {
        value: 50,
        max: 200,
      },
    })

    const fill = wrapper.find('.progress-fill')

    expect(fill.attributes('style')).toContain('width: 25%;')
  })

  it('clamps values between 0 and 100%', () => {
    const wrapperOver = mount(Progress, {
      props: {
        value: 150,
        max: 100,
      },
    })

    expect(wrapperOver.find('.progress-fill').attributes('style')).toContain('width: 100%;')

    const wrapperUnder = mount(Progress, {
      props: {
        value: -20,
        max: 100,
      },
    })

    expect(wrapperUnder.find('.progress-fill').attributes('style')).toContain('width: 0%;')
  })

  it('applies correct size classes', () => {
    const wrapperSm = mount(Progress, {
      props: { value: 10, size: 'sm' },
    })

    expect(wrapperSm.find('.progress-track').classes()).toContain('is-sm')

    const wrapperLg = mount(Progress, {
      props: { value: 10, size: 'lg' },
    })

    expect(wrapperLg.find('.progress-track').classes()).toContain('is-lg')
  })

  it('applies explicit variants', () => {
    const wrapperDefault = mount(Progress, {
      props: { value: 10, variant: 'default' },
    })

    expect(wrapperDefault.find('.progress-track').attributes('style')).toContain('--progress-fg: var(--theme-accent)')

    const wrapperWarning = mount(Progress, {
      props: { value: 10, variant: 'warning' },
    })

    expect(wrapperWarning.find('.progress-track').attributes('style')).toContain('--progress-fg: var(--color-status-warning)')

    const wrapperDanger = mount(Progress, {
      props: { value: 10, variant: 'danger' },
    })

    expect(wrapperDanger.find('.progress-track').attributes('style')).toContain('--progress-fg: var(--color-status-danger)')
  })

  it('applies dynamic colors scale', () => {
    // 0-59%: theme-accent
    const wrapperLow = mount(Progress, {
      props: { value: 30, dynamicColors: true },
    })

    expect(wrapperLow.find('.progress-track').attributes('style')).toContain('--progress-fg: var(--theme-accent)')

    // 60-89%: warning
    const wrapperMid = mount(Progress, {
      props: { value: 75, dynamicColors: true },
    })

    expect(wrapperMid.find('.progress-track').attributes('style')).toContain('--progress-fg: var(--color-status-warning)')

    // 90-100%: success
    const wrapperHigh = mount(Progress, {
      props: { value: 95, dynamicColors: true },
    })

    expect(wrapperHigh.find('.progress-track').attributes('style')).toContain('--progress-fg: var(--color-status-success)')
  })

  it('applies custom color prop', () => {
    const wrapper = mount(Progress, {
      props: {
        value: 50,
        color: '#ff0000',
      },
    })

    expect(wrapper.find('.progress-track').attributes('style')).toContain('--progress-fg: #ff0000')
  })

  it('does not contain accessibility attributes (local/no-pure-accessibility compliance)', () => {
    const wrapper = mount(Progress, {
      props: {
        value: 50,
      },
    })

    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-valuenow')).toBeUndefined()
    expect(wrapper.attributes('aria-valuemin')).toBeUndefined()
    expect(wrapper.attributes('aria-valuemax')).toBeUndefined()
  })
})
