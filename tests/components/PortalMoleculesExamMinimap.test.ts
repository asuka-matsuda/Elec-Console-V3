import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PortalMoleculesExamMinimap from '../../app/components/portal/MoleculesExamMinimap.vue'
import type { CircuitItem } from '../../app/types/souden'

describe('PortalMoleculesExamMinimap.vue', () => {
  const mockCircuits: CircuitItem[] = [
    {
      id: 'c1',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '高圧盤',
      banMeisho: '盤A',
      kairoBangou: '1',
      kairoMeisho: '照明回路',
      p1ConfirmedAt: '2026-09-10',
      p1Kakunin: true,
      p1Mashishime: true,
    } as CircuitItem,
    {
      id: 'c2',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '高圧盤',
      banMeisho: '盤A',
      kairoBangou: '2',
      kairoMeisho: '動力回路',
      isExcluded: true,
    } as CircuitItem,
    {
      id: 'c3',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '高圧盤',
      banMeisho: '盤A',
      kairoBangou: '3',
      kairoMeisho: '空調回路',
    } as CircuitItem,
  ]

  it('renders correct number of tiles', () => {
    const wrapper = mount(PortalMoleculesExamMinimap, {
      props: {
        circuits: mockCircuits,
        phase: 1,
      },
    })

    const buttons = wrapper.findAll('button')

    expect(buttons.length).toBe(3)
  })

  it('applies correct classes for completed, excluded, and pending circuits', () => {
    const wrapper = mount(PortalMoleculesExamMinimap, {
      props: {
        circuits: mockCircuits,
        phase: 1,
      },
    })

    const buttons = wrapper.findAll('button')

    expect(buttons[0].classes()).toContain('is-completed')
    expect(buttons[0].classes()).not.toContain('is-excluded')

    expect(buttons[1].classes()).toContain('is-excluded')
    expect(buttons[1].classes()).not.toContain('is-completed')

    expect(buttons[2].classes()).not.toContain('is-completed')
    expect(buttons[2].classes()).not.toContain('is-excluded')
  })

  it('emits selectCircuit when a tile is clicked', async () => {
    const wrapper = mount(PortalMoleculesExamMinimap, {
      props: {
        circuits: mockCircuits,
        phase: 1,
      },
    })

    await wrapper.findAll('button')[0].trigger('click')

    const emitted = wrapper.emitted('selectCircuit')

    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual(mockCircuits[0])
  })

  it('includes completion status in the title attribute', () => {
    const wrapper = mount(PortalMoleculesExamMinimap, {
      props: {
        circuits: mockCircuits,
        phase: 1,
      },
    })

    const buttons = wrapper.findAll('button')

    expect(buttons[0].attributes('title')).toContain('(完了)')
    expect(buttons[1].attributes('title')).toContain('(除外)')
    expect(buttons[2].attributes('title')).toContain('(未着手)')
  })

  it('renders inside an AtomsPanel container', () => {
    const wrapper = mount(PortalMoleculesExamMinimap, {
      props: {
        circuits: mockCircuits,
        phase: 1,
      },
    })

    const panel = wrapper.findComponent({ name: 'AtomsPanel' })

    expect(panel.exists()).toBe(true)
  })
})
