import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import DetailSiteSettings from '../../../app/components/portal/admin/DetailSiteSettings.vue'
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

describe('DetailSiteSettings.vue', () => {
  const dummySite: Site = {
    id: 'site-a',
    name: '新宿現場',
    status: 'in_progress',
    createdAt: '2026-09-01',
  }

  it('renders empty state when site is null', () => {
    const wrapper = mount(DetailSiteSettings, {
      props: {
        site: null,
      },
    })

    expect(wrapper.text()).toContain('現場が選択されていません')
  })

  it('renders site details and category tabs when site is provided', () => {
    const wrapper = mount(DetailSiteSettings, {
      props: {
        site: dummySite,
      },
    })

    expect(wrapper.text()).toContain('新宿現場')
    expect(wrapper.text()).toContain('ID: site-a')
    expect(wrapper.text()).toContain('基本情報')
    expect(wrapper.text()).toContain('Excelデータ連携')
    expect(wrapper.text()).toContain('除外回路ルール')
    expect(wrapper.text()).toContain('改行禁止ワード')
  })

  it('emits save event when save button is clicked without readonly warnings', async () => {
    const wrapper = mount(DetailSiteSettings, {
      props: {
        site: dummySite,
      },
    })

    const buttons = wrapper.findAllComponents({ name: 'Button' })
    const saveBtn = buttons.find(b => b.text().includes('変更を保存'))

    expect(saveBtn?.exists()).toBe(true)
    await saveBtn!.trigger('click')

    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({
      id: 'site-a',
      name: '新宿現場',
    })
  })

  it('emits delete event when delete button is clicked', async () => {
    const wrapper = mount(DetailSiteSettings, {
      props: {
        site: dummySite,
      },
    })

    const buttons = wrapper.findAllComponents({ name: 'Button' })
    const deleteBtn = buttons.find(b => b.text().includes('削除'))

    expect(deleteBtn?.exists()).toBe(true)
    await deleteBtn?.trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')?.[0]?.[0]).toEqual(dummySite)
  })

  it('allows adding, editing, and removing excluded circuits', async () => {
    const wrapper = mount(DetailSiteSettings, {
      props: {
        site: {
          ...dummySite,
          excludedCircuits: ['盤A-1', '盤B-2'],
        },
      },
    })

    // rules タブに切り替える
    const tabs = wrapper.findComponent({ name: 'Tabs' })

    await tabs.vm.$emit('update:modelValue', 'rules')

    expect(wrapper.text()).toContain('除外回路の設定')

    // 1. 追加ボタン
    const addBtn = wrapper.findAllComponents({ name: 'Button' }).find(b => b.text().includes('除外回路を追加する'))

    expect(addBtn).toBeDefined()
    await addBtn!.trigger('click')

    const inputsAfterAdd = wrapper.findAllComponents({ name: 'Input' }).filter(i => i.props('placeholder')?.includes('盤A-回路1'))

    expect(inputsAfterAdd).toHaveLength(3)

    // 2. 削除ボタン
    const deleteBtns = wrapper.findAllComponents({ name: 'Button' }).filter(b => b.props('icon') === 'trash-2')
    // site header delete btn + excluded circuits trash buttons
    const ruleTrashBtns = deleteBtns.filter(b => !b.text().includes('削除'))

    expect(ruleTrashBtns.length).toBeGreaterThanOrEqual(2)
    await ruleTrashBtns[0]!.trigger('click')

    const inputsAfterDelete = wrapper.findAllComponents({ name: 'Input' }).filter(i => i.props('placeholder')?.includes('盤A-回路1'))

    expect(inputsAfterDelete).toHaveLength(2)

    // 3. 入力変更
    await inputsAfterDelete[0]!.vm.$emit('update:modelValue', '盤A-1-改')

    // 保存実行して excludedCircuits が反映されていること
    const saveBtn = wrapper.findAllComponents({ name: 'Button' }).find(b => b.text().includes('変更を保存'))

    await saveBtn!.trigger('click')

    expect(wrapper.emitted('save')).toBeTruthy()
    const savedPayload = wrapper.emitted('save')?.[0]?.[0] as Site

    expect(savedPayload.excludedCircuits).toContain('盤A-1-改')
  })

  it('allows adding, editing, and removing no-break words', async () => {
    const wrapper = mount(DetailSiteSettings, {
      props: {
        site: {
          ...dummySite,
          noBreakWords: ['自動倉庫', '受変電設備'],
        },
      },
    })

    // wordBreak タブに切り替える
    const tabs = wrapper.findComponent({ name: 'Tabs' })

    await tabs.vm.$emit('update:modelValue', 'wordBreak')

    expect(wrapper.text()).toContain('改行禁止ワードの設定')

    // 1. 追加ボタン
    const addBtn = wrapper.findAllComponents({ name: 'Button' }).find(b => b.text().includes('改行禁止ワードを追加する'))

    expect(addBtn).toBeDefined()
    await addBtn!.trigger('click')

    const wordInputs = wrapper.findAllComponents({ name: 'Input' }).filter(i => i.props('placeholder')?.includes('自動倉庫'))

    expect(wordInputs).toHaveLength(3)

    // 2. 削除ボタン
    const deleteBtns = wrapper.findAllComponents({ name: 'Button' }).filter(b => b.props('icon') === 'trash-2')
    const wordTrashBtns = deleteBtns.filter(b => !b.text().includes('削除'))

    expect(wordTrashBtns.length).toBeGreaterThanOrEqual(2)
    await wordTrashBtns[0]!.trigger('click')

    const wordInputsAfterDelete = wrapper.findAllComponents({ name: 'Input' }).filter(i => i.props('placeholder')?.includes('自動倉庫'))

    expect(wordInputsAfterDelete).toHaveLength(2)

    // 3. 入力変更
    await wordInputsAfterDelete[0]!.vm.$emit('update:modelValue', '自家発電設備')

    // 保存実行して noBreakWords が反映されていること
    const saveBtn = wrapper.findAllComponents({ name: 'Button' }).find(b => b.text().includes('変更を保存'))

    await saveBtn!.trigger('click')

    expect(wrapper.emitted('save')).toBeTruthy()
    const savedPayload = wrapper.emitted('save')?.[0]?.[0] as Site

    expect(savedPayload.noBreakWords).toContain('自家発電設備')
  })
})
