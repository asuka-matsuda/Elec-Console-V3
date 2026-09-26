import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useCurrentSite } from '../../app/composables/portal/useCurrentSite'
import type { Site } from '../../app/types/admin'

const mockSites = ref<Site[]>([
  {
    id: 'site-1',
    name: '現場A',
    status: 'in_progress',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'site-2',
    name: '現場B',
    status: 'planning',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
])

const mockCurrentUser = ref<{
  loginId: string
  assignedSiteIds: string[]
}>({
  loginId: 'worker-1',
  assignedSiteIds: ['site-1'],
})

vi.mock('../../app/composables/admin/useAdminSites', () => ({
  useAdminSites: () => ({
    sites: mockSites,
    fetchSites: vi.fn(),
    isLoaded: ref(true),
  }),
}))

vi.mock('../../app/composables/useAuth', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser,
  }),
}))

describe('useCurrentSite', () => {
  it('resolves current site and siteName correctly', () => {
    const { site, siteName } = useCurrentSite('site-1')

    expect(site.value?.name).toBe('現場A')
    expect(siteName.value).toBe('現場A')
  })

  it('filters assigned sites according to currentUser permissions', () => {
    mockCurrentUser.value = {
      loginId: 'worker-1',
      assignedSiteIds: ['site-1'],
    }

    const { assignedSites, siteOptions } = useCurrentSite('site-1')

    expect(assignedSites.value).toHaveLength(1)
    expect(assignedSites.value[0].id).toBe('site-1')
    expect(siteOptions.value).toEqual([{ value: 'site-1', label: '現場A' }])
  })

  it('allows master loginId to access all sites', () => {
    mockCurrentUser.value = {
      loginId: 'master',
      assignedSiteIds: [],
    }

    const { assignedSites } = useCurrentSite('site-1')

    expect(assignedSites.value).toHaveLength(2)
  })
})
