import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PortalSoudenWorkerCell from '../../../app/components/portal/molecules/SoudenWorkerCell.vue'

describe('PortalSoudenWorkerCell.vue', () => {
  it('renders worker name and formatted date when worker is present', () => {
    const wrapper = mount(PortalSoudenWorkerCell, {
      props: {
        worker: '田中 太郎',
        confirmedAt: '2026-09-21T10:30:00',
      },
    })

    expect(wrapper.find('.cell-worker').text()).toBe('田中 太郎')
    expect(wrapper.find('.cell-date').text()).toBe('09/21 10:30')
    expect(wrapper.find('.cell-dash').exists()).toBe(false)
  })

  it('renders dash when worker is null or undefined', () => {
    const wrapper = mount(PortalSoudenWorkerCell, {
      props: {
        worker: null,
        confirmedAt: null,
      },
    })

    expect(wrapper.find('.cell-dash').text()).toBe('-')
    expect(wrapper.find('.cell-worker').exists()).toBe(false)
    expect(wrapper.find('.cell-date').exists()).toBe(false)
  })

  it('renders fallback dash for date when worker is present but confirmedAt is null', () => {
    const wrapper = mount(PortalSoudenWorkerCell, {
      props: {
        worker: '佐藤 次郎',
        confirmedAt: null,
      },
    })

    expect(wrapper.find('.cell-worker').text()).toBe('佐藤 次郎')
    expect(wrapper.find('.cell-date').text()).toBe('-')
  })
})
