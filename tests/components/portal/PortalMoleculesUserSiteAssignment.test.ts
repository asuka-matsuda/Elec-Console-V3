import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MoleculesUserSiteAssignment from '../../../app/components/portal/MoleculesUserSiteAssignment.vue'
import type { Site } from '../../../app/types/admin'

describe('MoleculesUserSiteAssignment.vue', () => {
  const dummySites: Site[] = [
    { id: 'site-a', name: '新宿現場', status: 'in_progress' },
    { id: 'site-b', name: '渋谷現場', status: 'planning' },
  ]

  it('renders site list checkboxes', () => {
    const wrapper = mount(MoleculesUserSiteAssignment, {
      props: {
        modelValue: ['site-a'],
        siteList: dummySites,
      },
    })

    expect(wrapper.text()).toContain('参加現場アサイン')
    expect(wrapper.text()).toContain('新宿現場 (site-a)')
    expect(wrapper.text()).toContain('渋谷現場 (site-b)')
  })

  it('renders empty state when siteList is empty', () => {
    const wrapper = mount(MoleculesUserSiteAssignment, {
      props: {
        modelValue: [],
        siteList: [],
      },
    })

    expect(wrapper.text()).toContain('登録された現場がありません')
  })
})
