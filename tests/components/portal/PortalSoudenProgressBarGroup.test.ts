import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SoudenProgressBarGroup from '../../../app/components/portal/souden/SoudenProgressBarGroup.vue'
import type { SoudenStats } from '../../../app/types/portal'

describe('SoudenProgressBarGroup.vue', () => {
  const dummyStats: SoudenStats = {
    totalPct: 75,
    totalCircuits: 50,
    totalActive: 48,
    totalExcluded: 2,
    p1Total: 50,
    p2Total: 45,
    p3Total: 30,

    trunkTotal: 20,
    trunkExcluded: 2,
    trunkP1: 20,
    trunkP1Pct: 100,
    trunkP2: 15,
    trunkP2Pct: 75,
    trunkP3: 10,
    trunkP3Pct: 50,
    trunkOverallPct: 75,

    secTotal: 30,
    secExcluded: 0,
    secP1: 30,
    secP1Pct: 100,
    secP2: 24,
    secP2Pct: 80,
    secP3: 15,
    secP3Pct: 50,
    secOverallPct: 76,
  }

  const globalOptions = {
    stubs: {
      NuxtLink: {
        props: ['to'],
        template: '<a :href="to"><slot /></a>',
      },
    },
  }

  it('renders all three phases with correct numbers and percentages for trunk', () => {
    const wrapper = mount(SoudenProgressBarGroup, {
      props: {
        stats: dummyStats,
        keiTo: '幹線',
        siteId: 'site-123',
      },
      global: globalOptions,
    })

    expect(wrapper.text()).toContain('回路確認 (Phase 1)')
    expect(wrapper.text()).toContain('20 / 20')
    expect(wrapper.text()).toContain('(100%)')

    expect(wrapper.text()).toContain('絶縁抵抗 (Phase 2)')
    expect(wrapper.text()).toContain('15 / 20')
    expect(wrapper.text()).toContain('(75%)')

    expect(wrapper.text()).toContain('送電・電圧 (Phase 3)')
    expect(wrapper.text()).toContain('10 / 20')
    expect(wrapper.text()).toContain('(50%)')
  })

  it('renders correctly for secondary circuits', () => {
    const wrapper = mount(SoudenProgressBarGroup, {
      props: {
        stats: dummyStats,
        keiTo: '二次側',
        siteId: 'site-123',
      },
      global: globalOptions,
    })

    expect(wrapper.text()).toContain('30 / 30')
    expect(wrapper.text()).toContain('24 / 30')
    expect(wrapper.text()).toContain('(80%)')
  })

  it('renders exclusion badge when excluded count is greater than 0', () => {
    const wrapper = mount(SoudenProgressBarGroup, {
      props: {
        stats: dummyStats,
        keiTo: '幹線',
        siteId: 'site-123',
      },
      global: globalOptions,
    })

    expect(wrapper.text()).toContain('除外: 2')
  })

  it('does not render exclusion badge when excluded count is 0', () => {
    const wrapper = mount(SoudenProgressBarGroup, {
      props: {
        stats: dummyStats,
        keiTo: '二次側',
        siteId: 'site-123',
      },
      global: globalOptions,
    })

    expect(wrapper.text()).not.toContain('除外')
  })

  it('renders test input buttons with correct links when siteId is provided', () => {
    const wrapper = mount(SoudenProgressBarGroup, {
      props: {
        stats: dummyStats,
        keiTo: '幹線',
        siteId: 'site-123',
      },
      global: globalOptions,
    })

    const buttons = wrapper.findAllComponents({ name: 'Button' })

    expect(buttons.length).toBe(3)
    expect(buttons[0]?.props('to')).toBe('/portal/site-123/phase1?kei_to=幹線')
    expect(buttons[1]?.props('to')).toBe('/portal/site-123/phase2?kei_to=幹線')
    expect(buttons[2]?.props('to')).toBe('/portal/site-123/phase3?kei_to=幹線')
  })

  it('does not render test input buttons when siteId is not provided', () => {
    const wrapper = mount(SoudenProgressBarGroup, {
      props: {
        stats: dummyStats,
        keiTo: '幹線',
      },
      global: globalOptions,
    })

    const buttons = wrapper.findAllComponents({ name: 'Button' })

    expect(buttons.length).toBe(0)
  })
})
