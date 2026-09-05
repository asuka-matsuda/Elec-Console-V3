import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useSiteSettingsForm } from '../../app/composables/portal/useSiteSettingsForm'
import type { Site } from '../../app/types/admin'

// モック: useAdminUsers
vi.mock('../../app/composables/admin/useAdminUsers', () => ({
  useAdminUsers: () => ({
    users: ref([
      { id: 'u1', name: '山田 太郎', assignedSiteIds: ['site-1'] },
      { id: 'u2', name: '佐藤 次郎', assignedSiteIds: ['site-2'] },
    ]),
    fetchUsers: vi.fn(),
  }),
}))

describe('useSiteSettingsForm', () => {
  const mockSite: Site = {
    id: 'site-1',
    name: '第1発電所',
    status: 'planning',
    createdAt: '2026-01-01',
    excludedCircuits: ['回路A', '回路B'],
  }

  it('should initialize form data from props site', () => {
    const site = ref<Site | null>(mockSite)
    const isOpen = ref(true)
    const onSave = vi.fn()

    const form = useSiteSettingsForm({ site, isOpen, onSave })

    expect(form.editId.value).toBe('site-1')
    expect(form.editStatus.value).toBe('planning')
    expect(form.editData.value.name).toBe('第1発電所')
    expect(form.excludedCircuitsList.value).toEqual(['回路A', '回路B'])
  })

  it('should add and remove excluded circuits', () => {
    const site = ref<Site | null>(mockSite)
    const isOpen = ref(true)
    const onSave = vi.fn()

    const form = useSiteSettingsForm({ site, isOpen, onSave })

    form.addCircuit()
    expect(form.excludedCircuitsList.value.length).toBe(3)
    expect(form.excludedCircuitsList.value[2]).toBe('')

    form.removeCircuit(0)
    expect(form.excludedCircuitsList.value).toEqual(['回路B', ''])
  })

  it('should trim and filter circuits on save', () => {
    const site = ref<Site | null>(mockSite)
    const isOpen = ref(true)
    const onSave = vi.fn()

    const form = useSiteSettingsForm({ site, isOpen, onSave })

    form.excludedCircuitsList.value = [' 回路1 ', '   ', '回路2']
    form.editData.value.name = '更新現場名'

    form.handleSave()

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'site-1',
        name: '更新現場名',
        excludedCircuits: ['回路1', '回路2'],
      }),
    )
    expect(isOpen.value).toBe(false)
  })
})
