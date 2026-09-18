import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Table from '../../app/components/common/molecules/Table.vue'
import type { TableColumn } from '../../app/types/components'

describe('Table.vue', () => {
  interface SampleUser extends Record<string, unknown> {
    id: number
    name: string
    role: string
    profile?: {
      department: string
    }
  }

  const sampleColumns: TableColumn<SampleUser>[] = [
    { key: 'name', label: '名前', sortable: true },
    { key: 'role', label: '役職' },
  ]

  const sampleData: SampleUser[] = [
    { id: 1, name: '山田太郎', role: '管理者', profile: { department: 'システム部' } },
    { id: 2, name: '佐藤花子', role: '一般', profile: { department: '営業部' } },
  ]

  it('データとカラムが正しく描画され、colgroup が生成されること', () => {
    const wrapper = mount(Table, {
      props: {
        columns: sampleColumns,
        data: sampleData,
      },
    })

    expect(wrapper.find('.table-wrapper').exists()).toBe(true)
    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.findAll('colgroup col').length).toBe(sampleColumns.length)
    expect(wrapper.text()).toContain('山田太郎')
    expect(wrapper.text()).toContain('佐藤花子')
  })

  it('loading: true の場合にローディング表示となり、データ行が描画されないこと', () => {
    const wrapper = mount(Table, {
      props: {
        columns: sampleColumns,
        data: sampleData,
        loading: true,
        loadingText: 'データ読み込み中...',
      },
    })

    expect(wrapper.find('.loading-cell').exists()).toBe(true)
    expect(wrapper.find('.loading-text').text()).toBe('データ読み込み中...')
    // ローディング中はデータ行が存在しないこと
    expect(wrapper.findAll('tbody tr').length).toBe(1)
    expect(wrapper.text()).not.toContain('山田太郎')
  })

  it('header-${key} スロットが指定された場合にカスタムヘッダーが描画されること', () => {
    const wrapper = mount(Table, {
      props: {
        columns: sampleColumns,
        data: sampleData,
      },
      slots: {
        'header-name': '<template #header-name="{ column }"><span class="custom-header">★{{ column.label }}★</span></template>',
      },
    })

    expect(wrapper.find('.custom-header').exists()).toBe(true)
    expect(wrapper.find('.custom-header').text()).toBe('★名前★')
  })

  it('カスタムセルスロットが全コンテキスト（value, row, index, column）を受け取って描画されること', () => {
    const wrapper = mount(Table, {
      props: {
        columns: sampleColumns,
        data: sampleData,
      },
      slots: {
        'cell-role': '<template #cell-role="{ value, row, index }"><span class="custom-badge">{{ index }}: {{ row.name }} - {{ value }}</span></template>',
      },
    })

    const badges = wrapper.findAll('.custom-badge')

    expect(badges.length).toBe(2)
    expect(badges[0].text()).toBe('0: 山田太郎 - 管理者')
    expect(badges[1].text()).toBe('1: 佐藤花子 - 一般')
  })

  it('ドット記法のネストキー（例: profile.department）が正しく描画されること', () => {
    const nestedColumns: TableColumn<SampleUser>[] = [
      { key: 'name', label: '名前' },
      { key: 'profile.department', label: '部署' },
    ]

    const wrapper = mount(Table, {
      props: {
        columns: nestedColumns,
        data: sampleData,
      },
    })

    expect(wrapper.text()).toContain('システム部')
    expect(wrapper.text()).toContain('営業部')
  })

  it('rowClass と rowId が正しく適用されること', () => {
    const wrapper = mount(Table, {
      props: {
        columns: sampleColumns,
        data: sampleData,
        rowId: (row: SampleUser) => `custom-row-${row.id}`,
        rowClass: (row: SampleUser) => (row.id === 1 ? 'is-active' : ''),
      },
    })

    const rows = wrapper.findAll('tbody tr')

    expect(rows[0].attributes('id')).toBe('custom-row-1')
    expect(rows[0].classes()).toContain('is-active')
    expect(rows[1].attributes('id')).toBe('custom-row-2')
    expect(rows[1].classes()).not.toContain('is-active')
  })

  it('interactiveRow: true の場合に行クリックで rowClick イベントが emit されること', async () => {
    const wrapper = mount(Table, {
      props: {
        columns: sampleColumns,
        data: sampleData,
        interactiveRow: true,
      },
    })

    const rows = wrapper.findAll('tbody tr')

    expect(rows[0].classes()).toContain('is-interactive')

    await rows[0].trigger('click')
    expect(wrapper.emitted('rowClick')).toBeTruthy()
    const payload = wrapper.emitted('rowClick')?.[0]?.[0] as { row: SampleUser, index: number }

    expect(payload.row.id).toBe(1)
    expect(payload.index).toBe(0)
  })

  it('未ソート状態からソート可能な列をクリックした際に update:sortBy が emit されること', async () => {
    const wrapper = mount(Table, {
      props: {
        columns: sampleColumns,
        data: sampleData,
      },
    })

    const thComponent = wrapper.findComponent({ name: 'TableTh' })

    if (thComponent.exists()) {
      await thComponent.vm.$emit('sort', sampleColumns[0])
      expect(wrapper.emitted('update:sortBy')).toBeTruthy()
      expect(wrapper.emitted('update:sortBy')?.[0]).toEqual(['name'])
    }
  })

  it('昇順(asc)状態の列を再度クリックすると update:sortOrder に desc が emit されること', async () => {
    const wrapper = mount(Table, {
      props: {
        columns: sampleColumns,
        data: sampleData,
        sortBy: 'name',
        sortOrder: 'asc',
      },
    })

    const thComponent = wrapper.findComponent({ name: 'TableTh' })

    if (thComponent.exists()) {
      await thComponent.vm.$emit('sort', sampleColumns[0])
      expect(wrapper.emitted('update:sortOrder')).toBeTruthy()
      expect(wrapper.emitted('update:sortOrder')?.[0]).toEqual(['desc'])
    }
  })

  it('降順(desc)状態の列を再度クリックすると sortOrder: null（ソート解除）が emit されること', async () => {
    const wrapper = mount(Table, {
      props: {
        columns: sampleColumns,
        data: sampleData,
        sortBy: 'name',
        sortOrder: 'desc',
      },
    })

    const thComponent = wrapper.findComponent({ name: 'TableTh' })

    if (thComponent.exists()) {
      await thComponent.vm.$emit('sort', sampleColumns[0])
      expect(wrapper.emitted('update:sortBy')).toBeTruthy()
      expect(wrapper.emitted('update:sortOrder')).toBeTruthy()
      expect(wrapper.emitted('update:sortBy')?.[0]).toEqual([undefined])
      expect(wrapper.emitted('update:sortOrder')?.[0]).toEqual([null])
    }
  })

  it('sortable: false が指定された列ではソートイベントが emit されないこと', async () => {
    const nonSortableColumns: TableColumn<SampleUser>[] = [
      { key: 'role', label: '役職', sortable: false },
    ]
    const wrapper = mount(Table, {
      props: {
        columns: nonSortableColumns,
        data: sampleData,
      },
    })

    const thComponent = wrapper.findComponent({ name: 'TableTh' })

    if (thComponent.exists()) {
      await thComponent.vm.$emit('sort', nonSortableColumns[0])
      expect(wrapper.emitted('update:sortBy')).toBeFalsy()
      expect(wrapper.emitted('update:sortOrder')).toBeFalsy()
    }
  })

  it('subKey が指定された列で二段表示（メインとサブ情報）が正しく描画されること', () => {
    const columnsWithSubKey: TableColumn<SampleUser>[] = [
      { key: 'name', label: '名前' },
      { key: 'role', subKey: 'id', label: '役職/ID', align: 'right' as const },
    ]

    const wrapper = mount(Table, {
      props: {
        columns: columnsWithSubKey,
        data: sampleData,
      },
    })

    const stackedWrappers = wrapper.findAll('.stacked-cell')

    expect(stackedWrappers.length).toBe(2)
    expect(stackedWrappers[0].find('.main-text').text()).toBe('管理者')
    expect(stackedWrappers[0].find('.sub-text').text()).toBe('1')
  })

  it('データが空（0件）の場合に空状態（EmptyState）が全列 colspan で描画されること', () => {
    const wrapper = mount(Table, {
      props: {
        columns: sampleColumns,
        data: [],
        emptyText: '該当するデータはありません',
      },
    })

    const emptyTd = wrapper.find('.empty-cell')

    expect(emptyTd.exists()).toBe(true)
    expect(emptyTd.attributes('colspan')).toBe(String(sampleColumns.length))
    expect(wrapper.text()).toContain('該当するデータはありません')
  })
})
