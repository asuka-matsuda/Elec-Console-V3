import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PortalMoleculesSoudenWorkerCell from '../../../app/components/portal/MoleculesSoudenWorkerCell.vue'

describe('PortalMoleculesSoudenWorkerCell.vue', () => {
  it('renders worker name and formatted date when worker is present', () => {
    const wrapper = mount(PortalMoleculesSoudenWorkerCell, {
      props: {
        worker: '松田 飛鳥',
        confirmedAt: '2026-09-07T17:50:00.000Z',
      },
    })

    expect(wrapper.find('.worker-name').text()).toBe('松田 飛鳥')
    expect(wrapper.find('.worker-date').exists()).toBe(true)
    expect(wrapper.find('.worker-dash').exists()).toBe(false)
  })

  it('renders dash fallback when worker is null or empty', () => {
    const wrapper = mount(PortalMoleculesSoudenWorkerCell, {
      props: {
        worker: null,
        confirmedAt: null,
      },
    })

    expect(wrapper.find('.worker-name').exists()).toBe(false)
    expect(wrapper.find('.worker-dash').exists()).toBe(true)
    expect(wrapper.text()).toBe('-')
  })
})
