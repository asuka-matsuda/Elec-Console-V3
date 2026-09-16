import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OrganismsSiteSettingsDetail from '../../../app/components/portal/OrganismsSiteSettingsDetail.vue'
import type { Site } from '../../../app/types/admin'

describe('OrganismsSiteSettingsDetail.vue', () => {
  const dummySite: Site = {
    id: 'site-a',
    name: '新宿現場',
    status: 'in_progress',
    createdAt: '2026-09-01',
  }

  const baseProps = {
    site: null,
    editData: {},
    editStatus: 'in_progress',
    editId: 'site-a',
    statusOptions: [
      { label: '進行中', value: 'in_progress' },
      { label: '計画中', value: 'planning' },
    ],
    workerNames: ['山田 太郎'],
    excludedCircuitsList: ['盤A-1'],
    selectedFile: null,
    showSyncMsg: false,
    syncMsg: '',
    syncMsgType: 'info' as const,
    syncAction: null,
    isSyncing: false,
    syncResultData: null,
  }

  it('renders empty state when site is null', () => {
    const wrapper = mount(OrganismsSiteSettingsDetail, {
      props: baseProps,
    })

    expect(wrapper.text()).toContain('現場が選択されていません')
  })

  it('renders site details and category tabs when site is provided', () => {
    const wrapper = mount(OrganismsSiteSettingsDetail, {
      props: {
        ...baseProps,
        site: dummySite,
        editData: { ...dummySite },
      },
    })

    expect(wrapper.text()).toContain('新宿現場')
    expect(wrapper.text()).toContain('ID: site-a')
    expect(wrapper.text()).toContain('基本情報')
    expect(wrapper.text()).toContain('Excelデータ連携')
    expect(wrapper.text()).toContain('除外回路ルール')
  })

  it('emits save event when save button is clicked', async () => {
    const wrapper = mount(OrganismsSiteSettingsDetail, {
      props: {
        ...baseProps,
        site: dummySite,
        editData: { ...dummySite },
      },
    })

    const saveBtn = wrapper.findComponent({ name: 'Button' })

    await saveBtn.trigger('click')

    expect(wrapper.emitted('save')).toBeTruthy()
  })
})
