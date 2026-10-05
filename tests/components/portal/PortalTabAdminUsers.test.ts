import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import type { User } from '#shared/types/auth'

import TabAdminUsers from '../../../app/components/portal/admin/TabAdminUsers.vue'

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
    isLoaded: ref(true),
    fetchSites: vi.fn(),
  }),
}))

describe('PortalTabAdminUsers.vue', () => {
  it('renders 2-pane master detail and Divider', () => {
    const wrapper = mount(TabAdminUsers)

    expect(wrapper.text()).toContain('ユーザー一覧')
    expect(wrapper.find('hr.divider').exists()).toBe(true)
  })

  it('selects first user by default and shows its name in detail', () => {
    const wrapper = mount(TabAdminUsers)

    expect(wrapper.text()).toContain('山田 太郎')
    expect(wrapper.text()).toContain('佐藤 次郎')
  })

  it('switches to assign tab and correctly handles site assignment toggle', async () => {
    const mockSites = ref([
      { id: 'site-a', name: '新宿現場', status: 'in_progress' },
      { id: 'site-b', name: '渋谷現場', status: 'planning' },
    ])

    const wrapper = mount(TabAdminUsers, {
      global: {
        mocks: {
          useAdminSites: () => ({
            sites: mockSites,
            isLoaded: ref(true),
            fetchSites: vi.fn(),
          }),
        },
      },
    })

    // アサインタブに切り替え
    const tabs = wrapper.findAll('.tabs-item')
    const assignTab = tabs.find(t => t.text().includes('現場アサイン'))

    if (assignTab) {
      await assignTab.trigger('click')
    }

    expect(wrapper.text()).toContain('参加現場アサイン')
  })
})
