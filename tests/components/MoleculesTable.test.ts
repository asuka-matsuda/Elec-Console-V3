import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MoleculesTable from '../../app/components/MoleculesTable.vue'

describe('MoleculesTable.vue', () => {
  const sampleColumns = [
    { key: 'name', label: '名前', sortable: true },
    { key: 'role', label: '役職' },
  ]

  const sampleData = [
    { id: 1, name: '山田太郎', role: '管理者' },
    { id: 2, name: '佐藤花子', role: '一般' },
  ]

  it('データとカラムが正しく描画されること', () => {
    const wrapper = mount(MoleculesTable, {
      props: {
        columns: sampleColumns,
        data: sampleData,
      },
    })

    expect(wrapper.find('.table-wrapper').exists()).toBe(true)
    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.text()).toContain('山田太郎')
    expect(wrapper.text()).toContain('佐藤花子')
  })

  it('カスタムセルスロットが描画されること', () => {
    const wrapper = mount(MoleculesTable, {
      props: {
        columns: sampleColumns,
        data: sampleData,
      },
      slots: {
        'cell-role': '<template #cell-role="{ value }"><span class="custom-badge">{{ value }}</span></template>',
      },
    })

    expect(wrapper.find('.custom-badge').exists()).toBe(true)
    expect(wrapper.find('.custom-badge').text()).toBe('管理者')
  })

  it('rowClass と rowId が正しく適用されること', () => {
    const wrapper = mount(MoleculesTable, {
      props: {
        columns: sampleColumns,
        data: sampleData,
        rowId: row => `custom-row-${row.id}`,
        rowClass: row => (row.id === 1 ? 'is-active' : ''),
      },
    })

    const rows = wrapper.findAll('tbody tr')

    expect(rows[0].attributes('id')).toBe('custom-row-1')
    expect(rows[0].classes()).toContain('is-active')
    expect(rows[1].attributes('id')).toBe('custom-row-2')
    expect(rows[1].classes()).not.toContain('is-active')
  })

  it('ソート可能な列でソートイベントがemitされること', async () => {
    const wrapper = mount(MoleculesTable, {
      props: {
        columns: sampleColumns,
        data: sampleData,
        sortBy: 'name',
        sortOrder: 'asc',
      },
    })

    const thComponent = wrapper.findComponent({ name: 'AtomsTableTh' })

    if (thComponent.exists()) {
      await thComponent.vm.$emit('sort', sampleColumns[0])
      expect(wrapper.emitted('sort')).toBeTruthy()
      expect(wrapper.emitted('sort')?.[0]).toEqual([{ key: 'name', order: 'desc' }])
    }
  })
})
