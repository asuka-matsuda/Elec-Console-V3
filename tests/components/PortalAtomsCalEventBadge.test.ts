import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PortalAtomsCalEventBadge from '../../app/components/portal/AtomsCalEventBadge.vue'

describe('PortalAtomsCalEventBadge.vue', () => {
  it('renders title properly', () => {
    const wrapper = mount(PortalAtomsCalEventBadge, {
      props: {
        title: '受電確認試験',
      },
    })

    expect(wrapper.text()).toContain('受電確認試験')
  })

  it('hides time when allDay is true or start is null', () => {
    const wrapper = mount(PortalAtomsCalEventBadge, {
      props: {
        title: '終日イベント',
        allDay: true,
        start: new Date('2026-09-10T09:00:00'),
      },
    })

    expect(wrapper.find('.cal-badge-time').exists()).toBe(false)
  })

  it('formats time with start and end', () => {
    const start = new Date('2026-09-10T09:30:00')
    const end = new Date('2026-09-10T12:00:00')

    const wrapper = mount(PortalAtomsCalEventBadge, {
      props: {
        title: '現場立会',
        start,
        end,
      },
    })

    const timeSpan = wrapper.find('.cal-badge-time')

    expect(timeSpan.exists()).toBe(true)
    expect(timeSpan.text()).toBe('09:30 - 12:00')
  })

  it('formats time with start only', () => {
    const start = new Date('2026-09-10T14:00:00')

    const wrapper = mount(PortalAtomsCalEventBadge, {
      props: {
        title: '巡回点検',
        start,
      },
    })

    const timeSpan = wrapper.find('.cal-badge-time')

    expect(timeSpan.exists()).toBe(true)
    expect(timeSpan.text()).toBe('14:00~')
  })

  it('applies custom theme color via style attribute', () => {
    const wrapper = mount(PortalAtomsCalEventBadge, {
      props: {
        title: 'カラーテスト',
        color: '#ff0055',
      },
    })

    expect(wrapper.attributes('style')).toContain('--badge-color: #ff0055')
  })
})
