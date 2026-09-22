import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TableSoudenCircuit from '../../../app/components/portal/exam/TableSoudenCircuit.vue'
import type { TableColumn } from '../../../app/types/components'
import type { CircuitItem } from '../../../app/types/souden'

describe('TableSoudenCircuit.vue', () => {
  const sampleColumns: TableColumn<CircuitItem>[] = [
    { key: 'banMeisho', subKey: 'banShubetsu', label: '盤情報' },
    { key: 'kairoBangou', label: '回路番号', align: 'center' },
    { key: 'kairoMeisho', label: '回路名称' },
    { key: 'p1ConfirmedAt', label: 'P1確認日時', align: 'center' },
    { key: 'p2ConfirmedAt', label: 'P2確認日時', align: 'center' },
    { key: 'p3ConfirmedAt', label: 'P3確認日時', align: 'center' },
  ]

  const sampleCircuits: CircuitItem[] = [
    {
      id: 'c1',
      siteId: 'site1',
      banMeisho: '電灯盤1',
      banShubetsu: 'L-1',
      kairoKigou: 'L',
      kairoBangou: '1',
      kairoMeisho: '1F事務室\nコンセント',
      p1Kakunin: true,
      p1Mashishime: true,
      p1ConfirmedAt: '2026-09-21T10:00:00',
      p1Worker: '作業員A',
      p2IsComplete: false,
      p2ConfirmedAt: null,
      p2Worker: null,
      p3ConfirmedAt: null,
      p3Worker: null,
      isExcluded: false,
    },
    {
      id: 'c2',
      siteId: 'site1',
      banMeisho: '動力盤1',
      banShubetsu: 'P-1',
      kairoKigou: 'M',
      kairoBangou: '2',
      kairoMeisho: null,
      p1Kakunin: true,
      p1Mashishime: true,
      p1ConfirmedAt: '2026-09-21T09:00:00',
      p1Worker: '作業員A',
      p2IsComplete: true,
      p2ConfirmedAt: '2026-09-21T11:00:00',
      p2Worker: '作業員B',
      p3ConfirmedAt: '2026-09-21T14:00:00',
      p3Worker: '作業員C',
      isExcluded: true,
    },
  ]

  it('回路番号と回路名称がデフォルトで正しく描画されること', () => {
    const wrapper = mount(TableSoudenCircuit, {
      props: {
        columns: sampleColumns,
        circuits: sampleCircuits,
      },
    })

    // 回路番号（PortalKairoSymbol）
    const symbols = wrapper.findAll('.kairo-symbol')

    expect(symbols.length).toBe(2)
    expect(symbols[0]?.find('.kairo-text').text()).toBe('1')
    expect(symbols[1]?.find('.kairo-text').text()).toBe('2')

    // 回路名称（改行保持および空値ハイフン）
    const meishoList = wrapper.findAll('.circuit-meisho')

    expect(meishoList.length).toBe(2)
    expect(meishoList[0]?.text()).toContain('1F事務室')
    expect(meishoList[1]?.text()).toBe('-')
  })

  it('測定者/日時セルがフェーズごとに正しく解決され、他フェーズのデータで汚染されないこと', () => {
    const wrapper = mount(TableSoudenCircuit, {
      props: {
        columns: sampleColumns,
        circuits: sampleCircuits,
      },
    })

    // 2行目(c2)は P1: 作業員A, P2: 作業員B, P3: 作業員C のデータを持つ
    const c2Row = wrapper.find('#row-c2')

    expect(c2Row.exists()).toBe(true)

    // c2 の各セル内のワーカーと日時を検証
    const c2WorkerNames = c2Row.findAll('.cell-worker')

    expect(c2WorkerNames.length).toBe(3)
    expect(c2WorkerNames[0]?.text()).toBe('作業員A')
    expect(c2WorkerNames[1]?.text()).toBe('作業員B')
    expect(c2WorkerNames[2]?.text()).toBe('作業員C')

    const c2Dates = c2Row.findAll('.cell-date')

    expect(c2Dates.length).toBe(3)
    expect(c2Dates[0]?.text()).toBe('09/21 09:00')
    expect(c2Dates[1]?.text()).toBe('09/21 11:00')
    expect(c2Dates[2]?.text()).toBe('09/21 14:00')

    // 1行目(c1)の P2, P3 は未測定のため '-' が表示され、他フェーズの値が入らないこと
    const c1Row = wrapper.find('#row-c1')
    const c1WorkerNames = c1Row.findAll('.cell-worker')

    expect(c1WorkerNames.length).toBe(1)
    expect(c1WorkerNames[0]?.text()).toBe('作業員A')

    const c1Dashes = c1Row.findAll('.cell-dash')

    expect(c1Dashes.length).toBe(2)
  })

  it('親コンポーネントからのカスタムスロットが最優先で描画されること', () => {
    const wrapper = mount(TableSoudenCircuit, {
      props: {
        columns: sampleColumns,
        circuits: sampleCircuits,
      },
      slots: {
        'cell-kairoMeisho': '<template #cell-kairoMeisho="{ row }"><div class="custom-meisho">CUSTOM: {{ row.id }}</div></template>',
      },
    })

    // デフォルトの .circuit-meisho は上書きされてカスタムスロットが表示されること
    expect(wrapper.findAll('.custom-meisho').length).toBe(2)
    expect(wrapper.find('.custom-meisho').text()).toBe('CUSTOM: c1')
    expect(wrapper.find('.circuit-meisho').exists()).toBe(false)
  })

  it('送電試験の行ステータスクラス（完了・ロック・除外・ハイライト）が正しく付与されること', () => {
    const wrapper = mount(TableSoudenCircuit, {
      props: {
        columns: sampleColumns,
        circuits: sampleCircuits,
        isComplete: (c: CircuitItem) => c.id === 'c1',
        isCircuitLocked: (c: CircuitItem) => c.id === 'c2',
        editingRowId: 'c1',
      },
    })

    const c1Row = wrapper.find('#row-c1')
    const c2Row = wrapper.find('#row-c2')

    // c1: 完了 + 編集ハイライト
    expect(c1Row.classes()).toContain('is-completed')
    expect(c1Row.classes()).toContain('is-highlighted')
    expect(c1Row.classes()).not.toContain('is-locked')
    expect(c1Row.classes()).not.toContain('is-excluded')

    // c2: ロック + 除外
    expect(c2Row.classes()).toContain('is-locked')
    expect(c2Row.classes()).toContain('is-excluded')
    expect(c2Row.classes()).not.toContain('is-completed')
    expect(c2Row.classes()).not.toContain('is-highlighted')
  })
})
