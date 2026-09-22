import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import TabAdminUsers from '../../../app/components/portal/admin/TabAdminUsers.vue'
import type { User } from '../../../app/types/auth'

const mockUsers = ref<User[]>([
  { id: 'user-01', loginId: 'yamada', firstName: '太郎', lastName: '山田', role: 'admin', requirePasswordReset: false },
  { id: 'user-02', loginId: 'sato', firstName: '次郎', lastName: '佐藤', role: 'worker', requirePasswordReset: false },
])

vi.mock('~/composables/admin/useAdminUsers', () => ({
  useAdminUsers: () => ({
    users: mockUsers,
    fetchUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    resetUserPassword: vi.fn(),
  }),
}))

vi.mock('~/composables/admin/useAdminSites', () => ({
  useAdminSites: () => ({
    sites: ref([]),
    fetchSites: vi.fn(),
  }),
}))

describe('PortalTabAdminUsers.vue', () => {
  it('renders 2-pane master detail components and Divider', () => {
    const wrapper = mount(TabAdminUsers)

    expect(wrapper.findComponent({ name: 'PortalMasterUserList' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'PortalDetailUserSettings' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'Divider' }).exists()).toBe(true)
  })

  it('selects first user by default and shows its name in detail', () => {
    const wrapper = mount(TabAdminUsers)

    expect(wrapper.text()).toContain('山田 太郎')
    expect(wrapper.text()).toContain('佐藤 次郎')
  })
})
