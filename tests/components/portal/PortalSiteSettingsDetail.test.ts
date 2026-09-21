import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import SiteSettingsDetail from '../../../app/components/portal/organisms/SiteSettingsDetail.vue'
import type { Site } from '../../../app/types/admin'

vi.mock('~/composables/admin/useAdminUsers', () => ({
  useAdminUsers: () => ({
    users: ref([]),
    fetchUsers: vi.fn(),
  }),
}))

vi.mock('~/composables/admin/useAdminSites', () => ({
  useAdminSites: () => ({
    updateSite: vi.fn().mockResolvedValue({ success: true }),
  }),
}))

describe('SiteSettingsDetail.vue', () => {
  const dummySite: Site = {
    id: 'site-a',
    name: '新宿現場',
    status: 'in_progress',
    createdAt: '2026-09-01',
  }

  it('renders empty state when site is null', () => {
    const wrapper = mount(SiteSettingsDetail, {
      props: {
        site: null,
      },
    })

    expect(wrapper.text()).toContain('現場が選択されていません')
  })

  it('renders site details and category tabs when site is provided', () => {
    const wrapper = mount(SiteSettingsDetail, {
      props: {
        site: dummySite,
      },
    })

    expect(wrapper.text()).toContain('新宿現場')
    expect(wrapper.text()).toContain('ID: site-a')
    expect(wrapper.text()).toContain('基本情報')
    expect(wrapper.text()).toContain('Excelデータ連携')
    expect(wrapper.text()).toContain('除外回路ルール')
  })

  it('emits save event when save button is clicked without readonly warnings', async () => {
    const wrapper = mount(SiteSettingsDetail, {
      props: {
        site: dummySite,
      },
    })

    const saveBtn = wrapper.findComponent({ name: 'Button' })

    await saveBtn.trigger('click')

    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({
      id: 'site-a',
      name: '新宿現場',
    })
  })
})
