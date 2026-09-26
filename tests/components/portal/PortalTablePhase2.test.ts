import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { CircuitItem } from '#shared/types/circuit'

import TablePhase2 from '../../../app/components/portal/exam/TablePhase2.vue'

describe('TablePhase2.vue', () => {
  const mockCircuits: CircuitItem[] = [
    {
      id: 'c1',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '電灯',
      banMeisho: '1L-1',
      kairoBangou: '1',
      kairoMeisho: '電灯回路1',
      haidenHoushiki: '1φ3W 100/200V',
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
      haidenHoushiki: '1φ3W 100/200V',
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
      haidenHoushiki: '3φ3W 200V',
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
    {
      id: 'c5',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '電灯',
      banMeisho: '1L-2',
      kairoBangou: '2',
      kairoMeisho: 'P1片方のみ回路',
      p1Kakunin: true,
      p1Mashishime: false,
      p1ConfirmedAt: '2026-09-21T10:00:00Z',
      p2ConfirmedAt: null,
      p2IsComplete: false,
    },
  ]

  const globalStubs = {
    PortalTableSoudenCircuit: {
      name: 'PortalTableSoudenCircuit',
      props: ['circuits', 'columns', 'isCircuitLocked', 'isComplete'],
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
    PortalCellPhaseMeas: {
      name: 'PortalCellPhaseMeas',
      props: ['modelValue', 'label', 'status', 'disabled', 'threshold'],
      emits: ['update:modelValue', 'enter'],
      template: `
        <div class="stub-meas-cell" :data-label="label" :data-disabled="disabled">
          <span class="label">{{ label }}</span>
          <input
            class="meas-input"
            :value="modelValue"
            :disabled="disabled"
            @input="$emit('update:modelValue', $event.target.value)"
            @keydown.enter="$emit('enter')"
          />
          <span v-if="status" class="status-badge">{{ status }}</span>
        </div>
      `,
    },
    Button: {
      props: ['variant', 'disabled', 'loading'],
      template: '<button class="stub-button" :disabled="disabled" :data-variant="variant"><slot /></button>',
    },
    Textarea: {
      props: ['modelValue', 'placeholder', 'rows', 'disabled'],
      emits: ['update:modelValue'],
      template: '<textarea class="stub-textarea" :value="modelValue" :placeholder="placeholder" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
    },
  }

  const createWrapper = (customProps = {}) => {
    return mount(TablePhase2, {
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

  it('未完了回路では最初からInput・Textareaが表示され、「全相OK」と「確定」ボタンが配置されること', () => {
    const wrapper = createWrapper()
    const row1 = wrapper.find('.circuit-row[data-row-id="c1"]')

    // 測定欄にInputが存在すること
    expect(row1.findAll('.meas-input').length).toBe(3)
    // 備考欄にTextareaが存在すること
    expect(row1.find('.stub-textarea').exists()).toBe(true)

    const buttons = row1.findAll('.col-actions .stub-button')

    expect(buttons.length).toBe(2)
    expect(buttons[0]?.text()).toBe('全相OK')
    expect(buttons[1]?.text()).toBe('確定')
  })

  it('「全相OK」をクリックすると各相Inputに100が記入され、確定ボタンを押すまではconfirmが発火しないこと', async () => {
    const wrapper = createWrapper()
    const row1 = wrapper.find('.circuit-row[data-row-id="c1"]')

    const allOkBtn = row1.findAll('.col-actions .stub-button')[0]

    await allOkBtn?.trigger('click')

    // 確定を押す前はconfirmが発火しないこと
    expect(wrapper.emitted('confirm')).toBeFalsy()

    // 各Inputの値が100になっていること
    const rInput = row1.find('.col-zetsuenR .meas-input')
    const sInput = row1.find('.col-zetsuenS .meas-input')
    const tInput = row1.find('.col-zetsuenT .meas-input')

    expect((rInput.element as HTMLInputElement).value).toBe('100')
    expect((sInput.element as HTMLInputElement).value).toBe('100')
    expect((tInput.element as HTMLInputElement).value).toBe('100')

    // 確定をクリック
    const confirmBtn = row1.findAll('.col-actions .stub-button')[1]

    await confirmBtn?.trigger('click')

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
      remarks: '特記事項なし',
      isComplete: true, // 3相すべてOKなので true
    })
  })

  it('各相の一部のみ入力して確定した場合、confirmは発火するが isComplete: false となること', async () => {
    const wrapper = createWrapper()
    const row1 = wrapper.find('.circuit-row[data-row-id="c1"]')

    // R相のみ入力
    const rInput = row1.find('.col-zetsuenR .meas-input')

    await rInput.setValue('50.0')

    // 確定をクリック
    const confirmBtn = row1.findAll('.col-actions .stub-button')[1]

    await confirmBtn?.trigger('click')

    expect(wrapper.emitted('confirm')).toBeTruthy()
    const emitted = wrapper.emitted('confirm')?.[0]

    expect(emitted?.[1]).toEqual({
      rVal: 50.0,
      sVal: null,
      tVal: null,
      rStatus: 'OK',
      sStatus: '',
      tStatus: '',
      remarks: '特記事項なし',
      isComplete: false, // 3相すべて揃っていないため false
    })
  })

  it('完了済み回路では入力欄がすべてdisabledになり、「解除」ボタンのみが表示されること', () => {
    const wrapper = createWrapper()
    const row2 = wrapper.find('.circuit-row[data-row-id="c2"]')

    // 操作列は解除ボタンのみ
    const buttons = row2.findAll('.col-actions .stub-button')

    expect(buttons.length).toBe(1)
    expect(buttons[0]?.text()).toBe('解除')
    expect(buttons[0]?.attributes('data-variant')).toBe('danger')

    // Input・Textarea が disabled であること
    const measCells = row2.findAll('.stub-meas-cell')

    for (const cell of measCells) {
      expect(cell.attributes('data-disabled')).toBe('true')
    }
    expect(row2.find('.stub-textarea').attributes('disabled')).toBeDefined()
  })

  it('「解除」をクリックしてもサーバー送信（clear）は発火せず、ローカルでdisabledが解除され確定ボタンに戻ること', async () => {
    const wrapper = createWrapper()
    const row2 = wrapper.find('.circuit-row[data-row-id="c2"]')

    const clearBtn = row2.find('.col-actions .stub-button')

    await clearBtn.trigger('click')

    // サーバーへの clear イベントは発火しないこと
    expect(wrapper.emitted('clear')).toBeFalsy()

    // ローカルで disabled が解除され、値（100）を保持したまま編集可能になること
    const rCell = row2.find('.col-zetsuenR .stub-meas-cell')

    expect(rCell.attributes('data-disabled')).toBe('false')
    expect((row2.find('.col-zetsuenR .meas-input').element as HTMLInputElement).value).toBe('100')

    // ボタンが「全相OK」と「確定」に戻ること
    const buttons = row2.findAll('.col-actions .stub-button')

    expect(buttons.length).toBe(2)
    expect(buttons[0]?.text()).toBe('全相OK')
    expect(buttons[1]?.text()).toBe('確定')
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

  it('P1で片方のみチェック済みの回路でも「⏸ P1未了」が表示され操作ボタンが表示されないこと', () => {
    const wrapper = createWrapper()
    const row5 = wrapper.find('.circuit-row[data-row-id="c5"]')

    expect(row5.find('.text-note').text()).toContain('⏸ P1未了')
    expect(row5.findAll('.stub-button').length).toBe(0)
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

  it('除外回路（isExcluded: true）では全相OKと確定ボタンが無効化されること', () => {
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
