/**
 * TabTemplates コンポーネントのテスト
 */
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import TabTemplates from '../../../app/components/master/TabTemplates.vue'

// モック
vi.mock('~/composables/master/useMasterTemplates', () => ({
  useMasterTemplates: () => ({
    items: ref([
      {
        id: 'tpl-1',
        name: '線名札（標準A4判）',
        logicType: 'tag',
        description: '全社共通の線名札ひな形',
        isAllSites: true,
        assignedSiteIds: [],
        file: {
          filename: 'tag_v1.xlsx',
          size: 15360,
          updatedAt: '2026-10-07T12:00:00Z',
        },
        createdAt: '2026-10-07T12:00:00Z',
        updatedAt: '2026-10-07T12:00:00Z',
      },
      {
        id: 'tpl-2',
        name: '新宿現場用 送電試験結果表',
        logicType: 'exam',
        description: '新宿新築プロジェクト専用フォーマット',
        isAllSites: false,
        assignedSiteIds: ['site-shinjuku'],
        file: {
          filename: 'shinjuku_exam.xlsx',
          size: 24500,
          updatedAt: '2026-10-07T12:00:00Z',
        },
        createdAt: '2026-10-07T12:00:00Z',
        updatedAt: '2026-10-07T12:00:00Z',
      },
    ]),
    isLoading: ref(false),
    isSaving: ref(false),
    deletingId: ref(null),
    downloadingId: ref(null),
    fetchTemplates: vi.fn(),
    saveTemplate: vi.fn(),
    downloadTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
  }),
}))

vi.mock('~/composables/admin/useAdminSites', () => ({
  useAdminSites: () => ({
    sites: ref([
      { id: 'site-shinjuku', name: '新宿新築プロジェクト' },
    ]),
    fetchSites: vi.fn(),
  }),
}))

vi.mock('~/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

vi.mock('~/composables/useModal', () => ({
  useModal: () => ({
    askConfirm: vi.fn(),
  }),
}))

describe('TabTemplates Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render template cards with logic badge, site assignments, and registered files', () => {
    const wrapper = mount(TabTemplates, {
      global: {
        stubs: {
          Icon: true,
          Badge: { template: '<span class="badge"><slot /></span>' },
          Button: { template: '<button><slot /></button>' },
          Note: { template: '<div class="note"><slot /></div>' },
          Dropzone: true,
          Modal: true,
          Table: {
            props: ['data', 'columns'],
            template: `
              <table>
                <tbody>
                  <tr v-for="row in data" :key="row.id || row.key">
                    <td v-for="col in columns" :key="col.key">
                      <slot :name="'cell-' + col.key" :row="row">{{ row[col.key] }}</slot>
                    </td>
                  </tr>
                </tbody>
              </table>
            `,
          },
          Toggle: true,
          Checkbox: true,
          Select: true,
          Input: true,
          Menu: {
            props: ['items'],
            template: `
              <div class="menu-stub">
                <button v-for="item in items" :key="item.label" @click="item.action">{{ item.label }}</button>
              </div>
            `,
          },
        },
      },
    })

    expect(wrapper.text()).toContain('登録済み帳票一覧')
    expect(wrapper.text()).toContain('線名札（標準A4判）')

    expect(wrapper.text()).toContain('全現場')
    expect(wrapper.text()).toContain('tag_v1.xlsx')
    expect(wrapper.text()).toContain('新宿現場用 送電試験結果表')
    expect(wrapper.text()).toContain('新宿新築プロジェクト')
    expect(wrapper.text()).toContain('shinjuku_exam.xlsx')
  })

  it('should filter available keys when search query is entered in key modal', async () => {
    const wrapper = mount(TabTemplates, {
      global: {
        stubs: {
          Icon: true,
          Badge: { template: '<span class="badge"><slot /></span>' },
          Button: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
          Note: { template: '<div class="note"><slot /></div>' },
          Dropzone: true,
          Input: {
            props: ['modelValue'],
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
          },
          Modal: { template: '<div><slot /></div>' },
          Table: {
            props: ['data', 'columns'],
            template: `
              <table>
                <tbody>
                  <tr v-for="row in data" :key="row.id || row.key" class="row">
                    <td v-for="col in (columns || [])" :key="col.key">
                      <slot :name="'cell-' + col.key" :row="row">{{ row[col.key] }}</slot>
                    </td>
                  </tr>
                </tbody>
              </table>
            `,
          },
          Toggle: true,
          Checkbox: true,
          Select: { template: '<div class="select-mock"><slot /></div>' },
          Menu: {
            props: ['items'],
            template: `
              <div class="menu-stub">
                <button v-for="item in items" :key="item.label" @click="item.action">{{ item.label }}</button>
              </div>
            `,
          },
        },
      },
    })

    // 「キー一覧」ボタンを押下してモーダルを開く
    const buttons = wrapper.findAll('button')
    const keyBtn = buttons.find(b => b.text().includes('キー一覧'))

    expect(keyBtn).toBeDefined()
    await keyBtn!.trigger('click')

    // 初期状態では全キーが表示される
    expect(wrapper.text()).toContain('%盤名称%')

    // キー検索用入力で絞り込み
    const inputs = wrapper.findAll('input')
    const searchInput = inputs.find(i => i.attributes('placeholder')?.includes('キー記法')) || inputs[inputs.length - 1]

    expect(searchInput).toBeDefined()
    await searchInput!.setValue('盤名称')
    expect(wrapper.text()).toContain('%盤名称%')

    // 一致しないキーワード
    await searchInput!.setValue('存在しないキー')
    expect(wrapper.text()).not.toContain('%盤名称%')
  })
})
