import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Phase2Table from '../../../app/components/portal/organisms/Phase2Table.vue'
import type { CircuitItem } from '../../../app/types/souden'

describe('Phase2Table.vue', () => {
  const mockCircuits: CircuitItem[] = [
    {
      id: 'c1',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '電灯',
      banMeisho: '1L-1',
      kairoBangou: '1',
      kairoMeisho: '電灯回路1',
      p1Kakunin: true,
      p1Mashishime: true,
      p1ConfirmedAt: '2026-09-21T10:00:00Z',
      zetsuenR: null,
      zetsuenS: null,
      zetsuenT: null,
      p2RStatus: null,
      p2SStatus: null,
      p2TStatus: null,
      p2ConfirmedAt: null,
      p2Worker: null,
      p2Remarks: '特記事項なし',
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
      p1Kakunin: true,
      p1Mashishime: true,
      p1ConfirmedAt: '2026-09-21T10:00:00Z',
      zetsuenR: 100,
      zetsuenS: 100,
      zetsuenT: 100,
      p2RStatus: 'OK',
      p2SStatus: 'OK',
      p2TStatus: 'OK',
      p2ConfirmedAt: '2026-09-21T11:00:00Z',
      p2Worker: '佐藤 次郎',
      p2Remarks: '',
      p2IsComplete: true,
    },
    {
      id: 'c3',
      siteId: 'site-1',
      keiTo: '二次側',
      banShubetsu: '動力',
      banMeisho: '1P-1',
      kairoBangou: '1',
      kairoMeisho: '動力回路1',
      p1Kakunin: true,
      p1Mashishime: true,
      p1ConfirmedAt: '2026-09-21T10:00:00Z',
      p2ConfirmedAt: null,
      p2IsComplete: false,
    },
    {
      id: 'c4',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '電灯',
      banMeisho: '1L-2',
      kairoBangou: '1',
      kairoMeisho: 'P1未完了回路',
      p1Kakunin: false,
      p1Mashishime: false,
      p1ConfirmedAt: null,
      p2ConfirmedAt: null,
      p2IsComplete: false,
    },
  ]

  const globalStubs = {
    PortalSoudenCircuitTable: {
      name: 'PortalSoudenCircuitTable',
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
    PortalPhaseMeasCell: {
      name: 'PortalPhaseMeasCell',
      props: ['modelValue', 'label', 'val', 'status', 'isEditing', 'threshold'],
      emits: ['update:modelValue', 'enter'],
      template: `
        <div class="stub-meas-cell" :data-label="label" :data-editing="isEditing">
          <span class="label">{{ label }}</span>
          <input
            v-if="isEditing"
            class="meas-input"
            :value="modelValue"
            @input="$emit('update:modelValue', $event.target.value)"
            @keydown.enter="$emit('enter')"
          />
          <span v-else class="meas-val">{{ val }}</span>
        </div>
      `,
    },
    Button: {
      props: ['variant', 'disabled', 'loading'],
      template: '<button class="stub-button" :disabled="disabled" :data-variant="variant"><slot /></button>',
    },
    Textarea: {
      props: ['modelValue', 'placeholder', 'rows'],
      emits: ['update:modelValue'],
      template: '<textarea class="stub-textarea" :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
    },
  }

  const createWrapper = (customProps = {}) => {
    return mount(Phase2Table, {
      props: {
        circuits: mockCircuits,
        isCircuitLocked: (c: CircuitItem) => c.id === 'c3',
        isActionLoading: {},
        isThreePhase: (c: CircuitItem) => c.banShubetsu === '動力',
        phase2ThresholdMegOhm: 1.0,
        evalMegStatus: (val: number | null | undefined) => {
          if (val == null) return null

          return val >= 1.0 ? 'OK' : 'NG'
        },
        ...customProps,
      },
      global: {
        stubs: globalStubs,
      },
    })
  }

  it('未完了回路では「全相OK」と「測定入力」ボタンが表示され、全相OKをクリックすると 100MΩ で confirm が発火すること', async () => {
    const wrapper = createWrapper()
    const row1 = wrapper.find('.circuit-row[data-row-id="c1"]')

    const buttons = row1.findAll('.col-actions .stub-button')

    expect(buttons.length).toBe(2)
    expect(buttons[0]?.text()).toBe('全相OK')
    expect(buttons[1]?.text()).toBe('測定入力')

    await buttons[0]?.trigger('click')

    expect(wrapper.emitted('confirm')).toBeTruthy()
    const emitted = wrapper.emitted('confirm')?.[0]

    expect(emitted?.[0]).toEqual(mockCircuits[0])
    expect(emitted?.[1]).toEqual({
      rVal: 100,
      sVal: 100,
      tVal: 100,
      rStatus: 'OK',
      sStatus: 'OK',
      tStatus: 'OK',
      isComplete: true,
    })
  })

  it('完了済み回路では「解除」と「変更」ボタンが表示され、解除をクリックすると clear が発火すること', async () => {
    const wrapper = createWrapper()
    const row2 = wrapper.find('.circuit-row[data-row-id="c2"]')

    const buttons = row2.findAll('.col-actions .stub-button')

    expect(buttons.length).toBe(2)
    expect(buttons[0]?.text()).toBe('解除')
    expect(buttons[0]?.attributes('data-variant')).toBe('danger')
    expect(buttons[1]?.text()).toBe('変更')

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

  it('前フェーズ（P1）未了回路では「⏸ P1未了」が表示され操作ボタンが表示されないこと', () => {
    const wrapper = createWrapper()
    const row4 = wrapper.find('.circuit-row[data-row-id="c4"]')

    expect(row4.find('.text-note').text()).toContain('⏸ P1未了')
    expect(row4.findAll('.stub-button').length).toBe(0)
  })

  it('「測定入力」をクリックすると手入力モードになり、入力値を保存すると判定結果とともに confirm が発火すること', async () => {
    const wrapper = createWrapper()
    const row1 = wrapper.find('.circuit-row[data-row-id="c1"]')

    // 測定入力ボタンをクリック
    const inputBtn = row1.findAll('.col-actions .stub-button')[1]

    await inputBtn?.trigger('click')

    // 手入力モード中のボタン表示検証
    const actionBtns = row1.findAll('.col-actions .stub-button')

    expect(actionBtns[0]?.text()).toBe('確定')
    expect(actionBtns[1]?.text()).toBe('取消')

    // 備考欄が Textarea になっていること
    const remarksArea = row1.find('.col-p2Remarks .stub-textarea')

    expect(remarksArea.exists()).toBe(true)
    await remarksArea.setValue('測定メモ入力')

    // R相・S相・T相のセルに入力
    const rInput = row1.find('.col-zetsuenR .meas-input')
    const sInput = row1.find('.col-zetsuenS .meas-input')
    const tInput = row1.find('.col-zetsuenT .meas-input')

    await rInput.setValue('50.5')
    await sInput.setValue('20.0')
    await tInput.setValue('0.5') // 閾値 1.0 未満のため NG

    // 確定をクリック
    await actionBtns[0]?.trigger('click')

    expect(wrapper.emitted('confirm')).toBeTruthy()
    const payload = wrapper.emitted('confirm')?.[0]

    expect(payload?.[0]).toEqual(mockCircuits[0])
    expect(payload?.[1]).toEqual({
      rVal: 50.5,
      sVal: 20.0,
      tVal: 0.5,
      rStatus: 'OK',
      sStatus: 'OK',
      tStatus: 'NG',
      remarks: '測定メモ入力',
      isComplete: false, // 1相でも NG があれば false
    })

    // 保存後は編集モードが解除されること
    expect(row1.find('.col-p2Remarks .stub-textarea').exists()).toBe(false)
  })

  it('手入力モードで「取消」をクリックすると手入力モードがキャンセルされること', async () => {
    const wrapper = createWrapper()
    const row1 = wrapper.find('.circuit-row[data-row-id="c1"]')

    const inputBtn = row1.findAll('.col-actions .stub-button')[1]

    await inputBtn?.trigger('click')

    const cancelBtn = row1.findAll('.col-actions .stub-button')[1]

    expect(cancelBtn?.text()).toBe('取消')
    await cancelBtn?.trigger('click')

    expect(row1.find('.col-p2Remarks .stub-textarea').exists()).toBe(false)
    expect(wrapper.emitted('confirm')).toBeFalsy()
  })

  it('三相と単相で各相セルのラベルが正しく切り替わること', () => {
    const wrapper = createWrapper()

    // c1 (単相・電灯)
    const row1 = wrapper.find('.circuit-row[data-row-id="c1"]')

    expect(row1.find('.col-zetsuenR .stub-meas-cell').attributes('data-label')).toBe('R - N')
    expect(row1.find('.col-zetsuenS .stub-meas-cell').attributes('data-label')).toBe('T - N')
    expect(row1.find('.col-zetsuenT .stub-meas-cell').attributes('data-label')).toBe('R - T')

    // c3 (三相・動力)
    const row3 = wrapper.find('.circuit-row[data-row-id="c3"]')

    expect(row3.find('.col-zetsuenR .stub-meas-cell').attributes('data-label')).toBe('R - S')
    expect(row3.find('.col-zetsuenS .stub-meas-cell').attributes('data-label')).toBe('S - T')
    expect(row3.find('.col-zetsuenT .stub-meas-cell').attributes('data-label')).toBe('R - T')
  })

  it('除外回路（isExcluded: true）では全相OKと測定入力ボタンが無効化されること', () => {
    const excludedCircuits = [
      {
        ...mockCircuits[0],
        id: 'c-ex',
        isExcluded: true,
      },
    ] as CircuitItem[]

    const wrapper = createWrapper({ circuits: excludedCircuits, isCircuitLocked: () => false })
    const row = wrapper.find('.circuit-row')
    const buttons = row.findAll('.col-actions .stub-button')

    expect(buttons[0]?.attributes('disabled')).toBeDefined()
    expect(buttons[1]?.attributes('disabled')).toBeDefined()
  })
})
