import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TablePhase1 from '../../../app/components/portal/exam/TablePhase1.vue'
import type { CircuitItem } from '../../../app/types/souden'

describe('TablePhase1.vue', () => {
  const mockCircuits: CircuitItem[] = [
    {
      id: 'c1',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '電灯',
      banMeisho: '1L-1',
      kairoBangou: '1',
      kairoMeisho: '電灯回路1',
      cableList: 'VVF 2.0-3C',
      haisenJousuu: '1',
      setsuchiList: 'D種',
      p1Kakunin: false,
      p1Mashishime: false,
      p1ConfirmedAt: null,
      p1Worker: null,
      p1Remarks: '特記事項なし',
      p2IsComplete: false,
    },
    {
      id: 'c2',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '電灯',
      banMeisho: '1L-1',
      kairoBangou: '2',
      kairoMeisho: '電灯回路2',
      cableList: 'VVF 1.6-2C',
      p1Kakunin: true,
      p1Mashishime: true,
      p1ConfirmedAt: '2026-09-21T10:00:00Z',
      p1Worker: '山田 太郎',
      p1Remarks: '',
      p2IsComplete: false,
    },
    {
      id: 'c3',
      siteId: 'site-1',
      keiTo: '二次側',
      banShubetsu: '動力',
      banMeisho: '1P-1',
      kairoBangou: '1',
      kairoMeisho: '動力回路1',
      p1Kakunin: false,
      p1Mashishime: false,
      p1ConfirmedAt: null,
      p1Worker: null,
      p2IsComplete: false,
    },
  ]

  const globalStubs = {
    PortalTableSoudenCircuit: {
      name: 'PortalTableSoudenCircuit',
      props: ['circuits', 'columns', 'editingRowId', 'isCircuitLocked', 'isComplete'],
      template: `
        <div class="souden-circuit-table-stub">
          <div v-for="(row, index) in circuits" :key="row.id" class="circuit-row" :data-row-id="row.id">
            <div v-for="col in columns" :key="col.key" :class="'col-' + col.key">
              <slot
                :name="'cell-' + col.key"
                :row="row"
                :value="row[col.key]"
                :index="index"
              />
            </div>
          </div>
        </div>
      `,
    },
    PortalKairoSymbol: {
      props: ['kigou', 'bangou'],
      template: '<span class="stub-kairo-symbol">{{ kigou }}{{ bangou }}</span>',
    },
    PortalCircuitSymbol: {
      props: ['kigou', 'bangou'],
      template: '<span class="stub-kairo-symbol">{{ kigou }}{{ bangou }}</span>',
    },
    Badge: {
      props: ['id'],
      template: '<span class="stub-badge" :data-badge-id="id"><slot /></span>',
    },
    Button: {
      props: ['variant', 'disabled', 'loading'],
      template: '<button class="stub-button" :disabled="disabled" :data-variant="variant"><slot /></button>',
    },
    Input: {
      props: ['modelValue', 'placeholder'],
      emits: ['update:modelValue'],
      template: '<input class="stub-input" :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    },
    Textarea: {
      props: ['modelValue', 'placeholder', 'rows'],
      emits: ['update:modelValue'],
      template: '<textarea class="stub-textarea" :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
    },
  }

  const createWrapper = (customProps = {}) => {
    return mount(TablePhase1, {
      props: {
        circuits: mockCircuits,
        isCircuitLocked: (c: CircuitItem) => c.id === 'c3',
        isActionLoading: {},
        ...customProps,
      },
      global: {
        stubs: globalStubs,
      },
    })
  }

  it('未完了の回路と完了済みの回路のステータスバッジが正しく描画されること', () => {
    const wrapper = createWrapper()
    const rows = wrapper.findAll('.circuit-row')

    expect(rows.length).toBe(3)

    // c1 (未完了)
    const badge1 = rows[0]?.find('.col-p1Kakunin .stub-badge')

    expect(badge1?.text()).toBe('未実施')
    expect(badge1?.attributes('data-badge-id')).toBeUndefined()

    // c2 (完了済み)
    const badge2 = rows[1]?.find('.col-p1Kakunin .stub-badge')

    expect(badge2?.text()).toBe('確認・増締済')
    expect(badge2?.attributes('data-badge-id')).toBe('exam:pass')
  })

  it('未完了回路では「確定」ボタンと「編集」ボタンが表示され、確定をクリックすると confirm が発火すること', async () => {
    const wrapper = createWrapper()
    const row1 = wrapper.find('.circuit-row[data-row-id="c1"]')

    const buttons = row1.findAll('.stub-button')

    expect(buttons.length).toBe(2)
    expect(buttons[0]?.text()).toBe('確定')
    expect(buttons[1]?.text()).toBe('編集')

    await buttons[0]?.trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
    expect(wrapper.emitted('confirm')?.[0]?.[0]).toEqual(mockCircuits[0])
  })

  it('完了済み回路では「解除」ボタンが表示され、クリックすると clear が発火すること', async () => {
    const wrapper = createWrapper()
    const row2 = wrapper.find('.circuit-row[data-row-id="c2"]')

    const buttons = row2.findAll('.stub-button')

    expect(buttons.length).toBe(1)
    expect(buttons[0]?.text()).toBe('解除')
    expect(buttons[0]?.attributes('data-variant')).toBe('danger')

    await buttons[0]?.trigger('click')
    expect(wrapper.emitted('clear')).toBeTruthy()
    expect(wrapper.emitted('clear')?.[0]?.[0]).toEqual(mockCircuits[1])
  })

  it('幹線未完了でロックされている回路では「⏸ 幹線未完了」が表示され操作ボタンが表示されないこと', () => {
    const wrapper = createWrapper()
    const row3 = wrapper.find('.circuit-row[data-row-id="c3"]')

    expect(row3.find('.text-note').text()).toContain('⏸ 幹線未完了')
    expect(row3.findAll('.stub-button').length).toBe(0)
  })

  it('「編集」ボタンをクリックするとインライン編集モードになり、保存すると save-edit が発火すること', async () => {
    const wrapper = createWrapper()
    const row1 = wrapper.find('.circuit-row[data-row-id="c1"]')

    // 編集モードに入る前
    expect(row1.find('.stub-input').exists()).toBe(false)

    // 編集ボタンをクリック
    const editBtn = row1.findAll('.stub-button')[1]

    await editBtn?.trigger('click')

    // 編集モード中：Input / Textarea が表示される
    expect(row1.find('.stub-input').exists()).toBe(true)
    const meishoInput = row1.find('.col-kairoMeisho .stub-textarea')

    expect(meishoInput.exists()).toBe(true)

    // 回路名称を書き換える
    await meishoInput.setValue('更新後の電灯回路1')

    // 保存ボタンをクリック
    const actionBtns = row1.findAll('.col-actions .stub-button')

    expect(actionBtns[0]?.text()).toBe('保存')
    expect(actionBtns[1]?.text()).toBe('取消')

    await actionBtns[0]?.trigger('click')

    expect(wrapper.emitted('save-edit')).toBeTruthy()
    const emittedPayload = wrapper.emitted('save-edit')?.[0]

    expect(emittedPayload?.[0]).toEqual(mockCircuits[0])
    expect((emittedPayload?.[1] as Record<string, string>).kairoMeisho).toBe('更新後の電灯回路1')

    // 保存後は編集モードが解除される
    expect(row1.find('.col-kairoMeisho .stub-textarea').exists()).toBe(false)
  })

  it('インライン編集モードで「取消」をクリックすると編集がキャンセルされること', async () => {
    const wrapper = createWrapper()
    const row1 = wrapper.find('.circuit-row[data-row-id="c1"]')

    const editBtn = row1.findAll('.stub-button')[1]

    await editBtn?.trigger('click')
    expect(row1.find('.stub-input').exists()).toBe(true)

    const cancelBtn = row1.findAll('.col-actions .stub-button')[1]

    expect(cancelBtn?.text()).toBe('取消')
    await cancelBtn?.trigger('click')

    expect(row1.find('.stub-input').exists()).toBe(false)
    expect(wrapper.emitted('save-edit')).toBeFalsy()
  })

  it('除外回路（isExcluded: true）では確定ボタンと編集ボタンが無効化されること', () => {
    const excludedCircuits = [
      {
        ...mockCircuits[0],
        id: 'c-ex',
        isExcluded: true,
      },
    ] as CircuitItem[]

    const wrapper = createWrapper({ circuits: excludedCircuits, isCircuitLocked: () => false })
    const row = wrapper.find('.circuit-row')
    const buttons = row.findAll('.stub-button')

    expect(buttons[0]?.attributes('disabled')).toBeDefined()
    expect(buttons[1]?.attributes('disabled')).toBeDefined()
  })
})
