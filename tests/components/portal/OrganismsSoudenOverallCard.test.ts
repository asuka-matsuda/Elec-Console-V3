import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PortalOrganismsSoudenOverallCard from '../../../app/components/portal/OrganismsSoudenOverallCard.vue'

describe('PortalOrganismsSoudenOverallCard.vue', () => {
  const dummyStats = {
    totalPct: 80,
    trunkOverallPct: 85,
    trunkTotal: 20,
    trunkExcluded: 1,
    trunkP1: 20,
    trunkP1Pct: 100,
    trunkP2: 18,
    trunkP2Pct: 90,
    trunkP3: 13,
    trunkP3Pct: 65,
    secOverallPct: 75,
    secTotal: 30,
    secExcluded: 2,
    secP1: 30,
    secP1Pct: 100,
    secP2: 24,
    secP2Pct: 80,
    secP3: 15,
    secP3Pct: 50,
  }

  const globalOptions = {
    stubs: {
      NuxtLink: {
        props: ['to'],
        template: '<a :href="to"><slot /></a>',
      },
    },
  }

  it('renders overall circular gauge and section header', () => {
    const wrapper = mount(PortalOrganismsSoudenOverallCard, {
      props: {
        stats: dummyStats,
        siteId: 'site-abc',
      },
      global: globalOptions,
    })

    expect(wrapper.text()).toContain('総合進捗')
    expect(wrapper.text()).toContain('全試験完了率')
  })

  it('renders both trunk and secondary progress groups', () => {
    const wrapper = mount(PortalOrganismsSoudenOverallCard, {
      props: {
        stats: dummyStats,
        siteId: 'site-abc',
      },
      global: globalOptions,
    })

    expect(wrapper.text()).toContain('幹線 全体')
    expect(wrapper.text()).toContain('二次側 全体')
  })
})
