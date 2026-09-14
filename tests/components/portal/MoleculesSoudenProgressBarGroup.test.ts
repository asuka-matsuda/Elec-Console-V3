import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PortalMoleculesSoudenProgressBarGroup from '../../../app/components/portal/MoleculesSoudenProgressBarGroup.vue'

describe('PortalMoleculesSoudenProgressBarGroup.vue', () => {
  const defaultProps = {
    total: 20,
    excluded: 2,
    p1Completed: 20,
    p1Pct: 100,
    p2Completed: 15,
    p2Pct: 75,
    p3Completed: 10,
    p3Pct: 50,
    siteId: 'site-123',
    keiTo: '幹線' as const,
  }

  const globalOptions = {
    stubs: {
      NuxtLink: {
        props: ['to'],
        template: '<a :href="to"><slot /></a>',
      },
    },
  }

  it('renders all three phases with correct numbers and percentages', () => {
    const wrapper = mount(PortalMoleculesSoudenProgressBarGroup, {
      props: defaultProps,
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

  it('renders exclusion badge when excluded count is greater than 0', () => {
    const wrapper = mount(PortalMoleculesSoudenProgressBarGroup, {
      props: defaultProps,
      global: globalOptions,
    })

    expect(wrapper.text()).toContain('除外: 2')
  })

  it('does not render exclusion badge when excluded count is 0', () => {
    const wrapper = mount(PortalMoleculesSoudenProgressBarGroup, {
      props: {
        ...defaultProps,
        excluded: 0,
      },
      global: globalOptions,
    })

    expect(wrapper.text()).not.toContain('除外')
  })

  it('renders test input buttons with correct links when siteId and keiTo are provided', () => {
    const wrapper = mount(PortalMoleculesSoudenProgressBarGroup, {
      props: defaultProps,
      global: globalOptions,
    })

    const buttons = wrapper.findAllComponents({ name: 'AtomsButton' })

    expect(buttons.length).toBe(3)
    expect(buttons[0]?.props('to')).toBe('/portal/site-123/phase1?kei_to=幹線')
    expect(buttons[1]?.props('to')).toBe('/portal/site-123/phase2?kei_to=幹線')
    expect(buttons[2]?.props('to')).toBe('/portal/site-123/phase3?kei_to=幹線')
  })
})
