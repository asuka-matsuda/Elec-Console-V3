import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MoleculesSiteListItem from '../../../app/components/portal/MoleculesSiteListItem.vue'
import type { Site } from '../../../app/types/admin'

describe('MoleculesSiteListItem.vue', () => {
  const dummySite: Site = {
    id: 'site-shinjuku-01',
    name: '新宿ビル改修工事',
    status: 'in_progress',
    createdAt: '2026-09-01T00:00:00Z',
  }

  it('renders site name, ID, and status badge', () => {
    const wrapper = mount(MoleculesSiteListItem, {
      props: {
        site: dummySite,
        isSelected: false,
      },
    })

    expect(wrapper.text()).toContain('新宿ビル改修工事')
    expect(wrapper.text()).toContain('site-shinjuku-01')
    expect(wrapper.text()).toContain('進行中')
    expect(wrapper.classes()).not.toContain('is-selected')
  })

  it('applies is-selected class when isSelected is true', () => {
    const wrapper = mount(MoleculesSiteListItem, {
      props: {
        site: dummySite,
        isSelected: true,
      },
    })

    expect(wrapper.classes()).toContain('is-selected')
  })

  it('emits select event when item is clicked', async () => {
    const wrapper = mount(MoleculesSiteListItem, {
      props: {
        site: dummySite,
      },
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')?.[0]).toEqual([dummySite])
  })

  it('emits toggle-disable event when toggle button is clicked', async () => {
    const wrapper = mount(MoleculesSiteListItem, {
      props: {
        site: dummySite,
      },
    })

    const button = wrapper.findComponent({ name: 'AtomsButton' })

    await button.trigger('click')

    expect(wrapper.emitted('toggle-disable')).toBeTruthy()
    expect(wrapper.emitted('toggle-disable')?.[0]).toEqual([dummySite])
  })
})
