import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UserSiteAssignment from '../../../app/components/portal/molecules/UserSiteAssignment.vue'
import type { Site } from '../../../app/types/admin'

describe('UserSiteAssignment.vue', () => {
  const dummySites: Site[] = [
    {
      id: 'site-alpha',
      name: '第一変電所',
      description: 'テスト変電所1',
      status: 'planning',
      address: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      latitude: null,
      longitude: null,
      zoomLevel: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'site-beta',
      name: '第二開閉所',
      description: 'テスト開閉所2',
      status: 'completed',
      address: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      latitude: null,
      longitude: null,
      zoomLevel: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ]

  it('renders site checkboxes when siteList is provided', () => {
    const wrapper = mount(UserSiteAssignment, {
      props: {
        siteList: dummySites,
        modelValue: ['site-alpha'],
      },
    })

    expect(wrapper.text()).toContain('参加現場アサイン')
    expect(wrapper.text()).toContain('第一変電所 (site-alpha)')
    expect(wrapper.text()).toContain('第二開閉所 (site-beta)')

    // FormGroup を使わず Checkbox が直接 2 つレンダリングされていること
    const checkboxes = wrapper.findAllComponents({ name: 'Checkbox' })

    expect(checkboxes).toHaveLength(2)
    expect(wrapper.findComponent({ name: 'FormGroup' }).exists()).toBe(false)
  })

  it('renders EmptyState when siteList is empty', () => {
    const wrapper = mount(UserSiteAssignment, {
      props: {
        siteList: [],
        modelValue: [],
      },
    })

    expect(wrapper.text()).toContain('登録された現場がありません')
    expect(wrapper.findAllComponents({ name: 'Checkbox' })).toHaveLength(0)
  })

  it('updates modelValue when a checkbox is toggled', async () => {
    const wrapper = mount(UserSiteAssignment, {
      props: {
        'siteList': dummySites,
        'modelValue': ['site-alpha'],
        'onUpdate:modelValue': (e: string[]) => wrapper.setProps({ modelValue: e }),
      },
    })

    const checkboxes = wrapper.findAllComponents({ name: 'Checkbox' })

    await checkboxes[1].find('input[type="checkbox"]').setValue(true)

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })
})
