import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import AdminSitesTab from '../../../app/components/portal/organisms/AdminSitesTab.vue'
import type { Site } from '../../../app/types/admin'

const mockSites = ref<Site[]>([
  { id: 'site-a', name: '現場A', status: 'in_progress', createdAt: '2026-09-01' },
  { id: 'site-b', name: '現場B', status: 'planning', createdAt: '2026-09-02' },
])

vi.mock('~/composables/admin/useAdminSites', () => ({
  useAdminSites: () => ({
    sites: mockSites,
    createSite: vi.fn(),
    toggleDisableSite: vi.fn(),
    updateSite: vi.fn(),
  }),
}))

vi.mock('~/composables/admin/useAdminUsers', () => ({
  useAdminUsers: () => ({
    users: ref([]),
    fetchUsers: vi.fn(),
  }),
}))

describe('PortalAdminSitesTab.vue', () => {
  it('renders 2-pane master detail components and Divider', () => {
    const wrapper = mount(AdminSitesTab)

    expect(wrapper.findComponent({ name: 'PortalSiteListMaster' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'PortalSiteSettingsDetail' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'Divider' }).exists()).toBe(true)
  })

  it('selects first site by default and shows its name in detail', () => {
    const wrapper = mount(AdminSitesTab)

    expect(wrapper.text()).toContain('現場A')
    expect(wrapper.text()).toContain('現場B')
  })
})
