import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { CircuitItem } from '#shared/types/circuit'

import PortalExamMinimap from '../../../app/components/portal/exam/ExamMinimap.vue'

describe('PortalExamMinimap.vue', () => {
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
    const wrapper = mount(PortalExamMinimap, {
      props: {
        circuits: mockCircuits,
        phase: 1,
      },
    })

    const buttons = wrapper.findAll('button')

    expect(buttons.length).toBe(3)
  })

  it('applies correct classes for completed, excluded, and pending circuits', () => {
    const wrapper = mount(PortalExamMinimap, {
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
    const wrapper = mount(PortalExamMinimap, {
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
})
