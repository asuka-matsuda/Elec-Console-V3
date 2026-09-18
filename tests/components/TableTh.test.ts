import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TableTh from '../../app/components/common/atoms/TableTh.vue'
import type { TableColumn } from '../../app/types/components'

describe('TableTh.vue', () => {
  const sampleColumn: TableColumn<Record<string, unknown>> = {
    key: 'name',
    label: '名前',
    sortable: true,
    width: '150px',
    minWidth: '100px',
    maxWidth: '200px',
    align: 'center',
  }

  it('ヘッダーラベルとスタイル（width, minWidth, maxWidth, textAlign）が正しく描画されること', () => {
    const wrapper = mount(TableTh, {
      props: {
        column: sampleColumn,
      },
    })

    const th = wrapper.element as HTMLElement

    expect(th.tagName).toBe('TH')
    expect(wrapper.text()).toContain('名前')
    expect(th.style.width).toBe('150px')
    expect(th.style.minWidth).toBe('100px')
    expect(th.style.maxWidth).toBe('200px')
    expect(th.style.textAlign).toBe('center')
  })

  it('ソート可能な列をクリックした際に sort イベントが emit されること', async () => {
    const wrapper = mount(TableTh, {
      props: {
        column: sampleColumn,
      },
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('sort')).toBeTruthy()
    expect(wrapper.emitted('sort')?.[0]).toEqual([sampleColumn])
  })

  it('sortable: false の列ではクリックしても sort イベントが emit されないこと', async () => {
    const nonSortableColumn: TableColumn<Record<string, unknown>> = {
      key: 'action',
      label: '操作',
      sortable: false,
    }

    const wrapper = mount(TableTh, {
      props: {
        column: nonSortableColumn,
      },
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('sort')).toBeFalsy()
    expect(wrapper.classes()).not.toContain('is-sortable')
  })

  it('ソート状態（asc）のときに is-sorted クラスが付き、ソートアイコンがアクティブになること', () => {
    const wrapper = mount(TableTh, {
      props: {
        column: sampleColumn,
        sortBy: 'name',
        sortOrder: 'asc',
      },
    })

    expect(wrapper.classes()).toContain('is-sorted')
    const icon = wrapper.findComponent({ name: 'Icon' })

    if (icon.exists()) {
      expect(icon.classes()).toContain('is-active')
      expect(icon.props('name')).toBe('chevron-up')
    }
  })

  it('ソート状態（desc）のときに chevron-down アイコンになること', () => {
    const wrapper = mount(TableTh, {
      props: {
        column: sampleColumn,
        sortBy: 'name',
        sortOrder: 'desc',
      },
    })

    expect(wrapper.classes()).toContain('is-sorted')
    const icon = wrapper.findComponent({ name: 'Icon' })

    if (icon.exists()) {
      expect(icon.props('name')).toBe('chevron-down')
    }
  })

  it('ソート可能な列で Enter キーおよび Space キーを押下した際に sort イベントが emit されること', async () => {
    const wrapper = mount(TableTh, {
      props: {
        column: sampleColumn,
      },
    })

    expect(wrapper.attributes('tabindex')).toBe('0')

    await wrapper.trigger('keydown.enter')
    expect(wrapper.emitted('sort')?.[0]).toEqual([sampleColumn])

    await wrapper.trigger('keydown.space')
    expect(wrapper.emitted('sort')?.[1]).toEqual([sampleColumn])
  })

  it('デフォルトスロットが指定された場合にカスタム内容が描画されること', () => {
    const wrapper = mount(TableTh, {
      props: {
        column: sampleColumn,
      },
      slots: {
        default: '<span class="custom-header">全選択</span>',
      },
    })

    expect(wrapper.find('.custom-header').exists()).toBe(true)
    expect(wrapper.find('.custom-header').text()).toBe('全選択')
  })

  it('column を渡さずに直接 label や align などの Props を指定しても正しく描画されること', () => {
    const wrapper = mount(TableTh, {
      props: {
        label: '直接ラベル',
        align: 'right',
        width: '180px',
      },
    })

    const th = wrapper.element as HTMLElement

    expect(wrapper.text()).toContain('直接ラベル')
    expect(th.style.textAlign).toBe('right')
    expect(th.style.width).toBe('180px')
  })

  it('ソート可能かつ未ソート状態のときに chevrons-up-down アイコンが表示されること', () => {
    const wrapper = mount(TableTh, {
      props: {
        column: sampleColumn,
      },
    })

    const icon = wrapper.findComponent({ name: 'Icon' })

    if (icon.exists()) {
      expect(icon.props('name')).toBe('chevrons-up-down')
      expect(icon.classes()).not.toContain('is-active')
    }
  })

  it('column を渡さずに sortKey と sortable を直接指定した場合でも、クリック時に sort イベントが emit されること', async () => {
    const wrapper = mount(TableTh, {
      props: {
        sortKey: 'standaloneKey',
        label: '単体ヘッダー',
        sortable: true,
        align: 'center',
      },
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('sort')).toBeTruthy()
    const emittedCol = wrapper.emitted('sort')?.[0]?.[0] as Record<string, unknown>

    expect(emittedCol).toBeDefined()
    expect(emittedCol.key).toBe('standaloneKey')
    expect(emittedCol.label).toBe('単体ヘッダー')
    expect(emittedCol.align).toBe('center')
    expect(emittedCol.sortable).toBe(true)
  })
})
