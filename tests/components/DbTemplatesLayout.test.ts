import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DbTemplatesLayout from '../../app/components/database/TemplatesLayout.vue'

describe('DbTemplatesLayout.vue', () => {
  const sampleData = [
    { id: 1, name: 'CVT 22', category: 'CVT' },
    { id: 2, name: 'CVT 38', category: 'CVT' },
  ]

  const sampleColumns = [
    { key: 'name', label: '品名' },
    { key: 'category', label: '分類' },
  ]

  const commonStubs = {
    OrganismsFilterPanel: {
      props: ['searchQuery', 'activeCats', 'categoryOptions', 'placeholder'],
      template: '<div class="filter-panel-stub">フィルターパネル</div>',
    },
    MoleculesTable: {
      props: ['columns', 'data', 'sortBy', 'sortOrder'],
      template: `
        <div class="table-stub">
          <span class="row-count">{{ data.length }}件</span>
          <slot />
        </div>
      `,
    },
    MoleculesEmptyState: {
      props: ['icon', 'title', 'description'],
      template: '<div class="empty-state-stub">{{ title }}</div>',
    },
  }

  it('renders table when data is provided', () => {
    const wrapper = mount(DbTemplatesLayout, {
      props: {
        data: sampleData,
        columns: sampleColumns,
        searchMapper: (item: { name: string, category: string }) => `${item.name} ${item.category}`,
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('.table-stub').exists()).toBe(true)
    expect(wrapper.text()).toContain('2件')
    expect(wrapper.find('.empty-state-stub').exists()).toBe(false)
  })

  it('renders empty state when data is empty', () => {
    const wrapper = mount(DbTemplatesLayout, {
      props: {
        data: [],
        columns: sampleColumns,
        searchMapper: (item: { name: string }) => item.name,
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('.empty-state-stub').exists()).toBe(true)
    expect(wrapper.text()).toContain('条件に一致するデータが見つかりません')
    expect(wrapper.find('.table-stub').exists()).toBe(false)
  })

  it('renders custom filter slot if provided', () => {
    const wrapper = mount(DbTemplatesLayout, {
      props: {
        data: sampleData,
        columns: sampleColumns,
        searchMapper: (item: { name: string }) => item.name,
      },
      slots: {
        filter: '<div class="custom-filter">カスタムフィルター</div>',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('.custom-filter').exists()).toBe(true)
    expect(wrapper.text()).toContain('カスタムフィルター')
    expect(wrapper.find('.filter-panel-stub').exists()).toBe(false)
  })

  it('renders disclaimer slot if provided', () => {
    const wrapper = mount(DbTemplatesLayout, {
      props: {
        data: sampleData,
        columns: sampleColumns,
        searchMapper: (item: { name: string }) => item.name,
      },
      slots: {
        disclaimer: '<div class="custom-disclaimer">データベース注記</div>',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('.custom-disclaimer').exists()).toBe(true)
    expect(wrapper.text()).toContain('データベース注記')
  })
})
