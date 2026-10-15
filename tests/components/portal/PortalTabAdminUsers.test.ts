import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import type { User } from '#shared/types/auth'

import TabAdminUsers from '../../../app/components/portal/admin/TabAdminUsers.vue'

const mockUsers = ref<User[]>([
  { id: 'user-master', loginId: 'master', firstName: '飛鳥', lastName: '松田', role: 'master', requirePasswordReset: false },
  {
    id: 'user-01',
    loginId: 'yamada',
    firstName: '太郎',
    lastName: '山田',
    role: 'worker',
    requirePasswordReset: false,
    assignedSiteIds: ['site-a'],
    siteAssignments: [{ siteId: 'site-a', role: 'admin' }],
  },
  { id: 'user-02', loginId: 'sato', firstName: '次郎', lastName: '佐藤', role: 'worker', requirePasswordReset: false },
])

const mockUpdateUser = vi.fn().mockResolvedValue({ success: true })
const mockSites = ref([
  { id: 'site-a', name: '新宿現場', status: 'in_progress' },
  { id: 'site-b', name: '渋谷現場', status: 'planning' },
])

vi.mock('~/composables/admin/useAdminUsers', () => ({
  useAdminUsers: () => ({
    users: mockUsers,
    fetchUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: mockUpdateUser,
    deleteUser: vi.fn(),
    resetUserPassword: vi.fn(),
  }),
}))

vi.mock('~/composables/admin/useAdminSites', () => ({
  useAdminSites: () => ({
    sites: mockSites,
    isLoaded: ref(true),
    fetchSites: vi.fn(),
  }),
}))

describe('PortalTabAdminUsers.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders 2-pane master detail, shows master badge, and does not show abolished global role selector', () => {
    const wrapper = mount(TabAdminUsers)

    expect(wrapper.text()).toContain('ユーザー一覧')
    expect(wrapper.find('hr.divider').exists()).toBe(true)
    expect(wrapper.text()).toContain('マスター')
    // 廃止された「基本権限（ロール）」欄が存在しないこと
    expect(wrapper.text()).not.toContain('基本権限（ロール）')
  })

  it('selects user and shows its name and loginId in detail', () => {
    const wrapper = mount(TabAdminUsers)

    expect(wrapper.text()).toContain('松田 飛鳥')
    expect(wrapper.text()).toContain('山田 太郎')
    expect(wrapper.text()).toContain('佐藤 次郎')
  })

  it('switches to assign tab, displays sites for non-master user, and calls updateUser on save', async () => {
    const wrapper = mount(TabAdminUsers)

    // 左ペインから一般ユーザー（山田 太郎）を選択
    const userCards = wrapper.findAll('.panel.is-interactive')
    const yamadaCard = userCards.find(c => c.text().includes('山田 太郎'))

    expect(yamadaCard).toBeDefined()
    await yamadaCard!.trigger('click')

    // アサインタブに切り替え
    const tabs = wrapper.findAll('.tabs-item')
    const assignTab = tabs.find(t => t.text().includes('現場アサイン'))

    expect(assignTab).toBeDefined()
    await assignTab!.trigger('click')

    expect(wrapper.text()).toContain('参加現場アサイン')
    expect(wrapper.text()).toContain('新宿現場')
    expect(wrapper.text()).toContain('渋谷現場')

    // 「変更を保存」ボタンを押下して updateUser が正しいペイロードで呼ばれることを検証
    const saveBtn = wrapper.findAll('button').find(b => b.text().includes('変更を保存'))

    expect(saveBtn).toBeDefined()
    await saveBtn!.trigger('click')

    expect(mockUpdateUser).toHaveBeenCalledWith(
      'user-01',
      expect.objectContaining({
        lastName: '山田',
        firstName: '太郎',
        assignedSiteIds: ['site-a'],
        siteAssignments: [{ siteId: 'site-a', role: 'admin' }],
      }),
    )
  })
})
