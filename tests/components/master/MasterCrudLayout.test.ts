import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MasterCrudLayout from '../../../app/components/master/MasterCrudLayout.vue'

describe('MasterCrudLayout.vue', () => {
  const dummyColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: '名前' },
    { key: 'actions', label: '操作' },
  ]

  const dummyData = [
    { id: '1', name: 'アイテム1' },
    { id: '2', name: 'アイテム2' },
  ]

  const globalStubs = {
    Button: {
      props: ['variant', 'icon', 'disabled', 'loading'],
      template: '<button class="stub-button" :disabled="disabled" :data-variant="variant"><slot /></button>',
    },
    Panel: {
      template: '<div class="stub-panel"><slot /></div>',
    },
    Table: {
      props: ['columns', 'data', 'loading', 'emptyText'],
      template: `
        <div class="stub-table">
          <div v-for="item in data" :key="item.id" class="stub-row">
            <span>{{ item.name }}</span>
            <slot name="cell-actions" :row="item" />
          </div>
        </div>
      `,
    },
    Modal: {
      props: ['modelValue', 'title', 'icon'],
      emits: ['update:modelValue'],
      template: `
        <div v-if="modelValue" class="stub-modal">
          <div class="modal-title">{{ title }}</div>
          <slot name="actions" />
          <slot />
        </div>
      `,
    },
    Alert: {
      template: '<div class="stub-alert"><slot /></div>',
    },
  }

  it('ヘッダー説明と作成ボタンが描画され、クリックで create が発火すること', async () => {
    const wrapper = mount(MasterCrudLayout, {
      props: {
        isModalOpen: false,
        description: 'テスト説明文',
        createButtonText: '新規追加',
        columns: dummyColumns,
        data: dummyData,
        modalTitle: '新規登録',
      },
      global: { stubs: globalStubs },
    })

    expect(wrapper.text()).toContain('テスト説明文')
    const createBtn = wrapper.find('.stub-button')

    expect(createBtn.text()).toBe('新規追加')

    await createBtn.trigger('click')
    expect(wrapper.emitted('create')).toBeTruthy()
  })

  it('テーブル行の編集ボタンと削除ボタンが正しく発火すること', async () => {
    const wrapper = mount(MasterCrudLayout, {
      props: {
        isModalOpen: false,
        description: 'テスト',
        createButtonText: '作成',
        columns: dummyColumns,
        data: dummyData,
        modalTitle: '登録',
      },
      global: { stubs: globalStubs },
    })

    const rows = wrapper.findAll('.stub-row')

    expect(rows.length).toBe(2)

    // 1行目のボタン（編集・削除）
    const buttons = rows[0]?.findAll('.stub-button')

    expect(buttons?.length).toBe(2)

    await buttons?.[0]?.trigger('click')
    expect(wrapper.emitted('edit')?.[0]).toEqual([dummyData[0]])

    await buttons?.[1]?.trigger('click')
    expect(wrapper.emitted('delete')?.[0]).toEqual([dummyData[0]])
  })

  it('モーダルが開いている時にフォームコンテンツと保存ボタンが正しく動作すること', async () => {
    const wrapper = mount(MasterCrudLayout, {
      props: {
        isModalOpen: true,
        description: 'テスト',
        createButtonText: '作成',
        columns: dummyColumns,
        data: dummyData,
        modalTitle: 'モーダルタイトル',
        saveButtonText: '保存する',
      },
      slots: {
        default: '<div class="custom-form-content">フォーム入力要素</div>',
      },
      global: { stubs: globalStubs },
    })

    expect(wrapper.find('.modal-title').text()).toBe('モーダルタイトル')
    expect(wrapper.find('.custom-form-content').exists()).toBe(true)

    const modalButtons = wrapper.find('.stub-modal').findAll('.stub-button')
    const saveBtn = modalButtons.find(b => b.text() === '保存する')

    expect(saveBtn).toBeDefined()

    await saveBtn?.trigger('click')
    expect(wrapper.emitted('save')).toBeTruthy()
  })
})
