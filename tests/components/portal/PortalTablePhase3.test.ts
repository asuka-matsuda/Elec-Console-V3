import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TablePhase3 from '../../../app/components/portal/exam/TablePhase3.vue'
import type { CircuitItem } from '../../../app/types/souden'

describe('TablePhase3.vue', () => {
  const mockCircuits: CircuitItem[] = [
    {
      id: 'c1',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '動力',
      banMeisho: '1P-1',
      kairoBangou: '1',
      kairoMeisho: '動力回路1',
      haidenHoushiki: '3φ3W 200V',
      p1Kakunin: true,
      p1Mashishime: true,
      p1ConfirmedAt: '2026-09-21T10:00:00Z',
      p2ConfirmedAt: '2026-09-21T11:00:00Z',
      p2IsComplete: true,
      denatsuRs: null,
      denatsuSt: null,
      denatsuRt: null,
      kensou: null,
      p3ConfirmedAt: null,
      p3Worker: null,
      p3Remarks: '',
      p3IsComplete: false,
    },
    {
      id: 'c2',
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
      p2ConfirmedAt: '2026-09-21T11:00:00Z',
      p2IsComplete: true,
      denatsuRs: 100,
      denatsuSt: 100,
      denatsuRt: 200,
      kensou: '良',
      p3ConfirmedAt: '2026-09-21T12:00:00Z',
      p3Worker: '佐藤 次郎',
      p3Remarks: '特記事項なし',
      p3IsComplete: true,
    },
    {
      id: 'c3',
      siteId: 'site-1',
      keiTo: '二次側',
      banShubetsu: '動力',
      banMeisho: '1P-2',
      kairoBangou: '1',
      kairoMeisho: '幹線未完了回路',
      haidenHoushiki: '3φ3W 200V',
      p1Kakunin: true,
      p1Mashishime: true,
      p1ConfirmedAt: '2026-09-21T10:00:00Z',
      p2ConfirmedAt: '2026-09-21T11:00:00Z',
      p2IsComplete: true,
      p3ConfirmedAt: null,
      p3IsComplete: false,
    },
    {
      id: 'c4',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '電灯',
      banMeisho: '1L-2',
      kairoBangou: '2',
      kairoMeisho: 'P2未了回路',
      haidenHoushiki: '1φ3W 100/200V',
      p1Kakunin: true,
      p1Mashishime: true,
      p1ConfirmedAt: '2026-09-21T10:00:00Z',
      p2ConfirmedAt: null,
      p2IsComplete: false,
      p3ConfirmedAt: null,
      p3IsComplete: false,
    },
    {
      id: 'c5',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '電灯',
      banMeisho: '1L-1',
      kairoBangou: '2',
      kairoMeisho: '単相未完了回路',
      haidenHoushiki: '1φ3W 100/200V',
      p1Kakunin: true,
      p1Mashishime: true,
      p1ConfirmedAt: '2026-09-21T10:00:00Z',
      p2ConfirmedAt: '2026-09-21T11:00:00Z',
      p2IsComplete: true,
      p3ConfirmedAt: null,
      p3IsComplete: false,
    },
    {
      id: 'c6',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '電灯',
      banMeisho: '1L-1',
      kairoBangou: '3',
      kairoMeisho: '除外回路',
      haidenHoushiki: '1φ3W 100/200V',
      p1Kakunin: true,
      p1Mashishime: true,
      p1ConfirmedAt: '2026-09-21T10:00:00Z',
      p2ConfirmedAt: '2026-09-21T11:00:00Z',
      p2IsComplete: true,
      isExcluded: true,
      p3ConfirmedAt: null,
      p3IsComplete: false,
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
      props: ['modelValue', 'label', 'unit', 'disabled', 'voltageRange'],
      emits: ['update:modelValue', 'enter'],
      template: `
        <div class="stub-volt-cell" :data-label="label" :data-disabled="disabled">
          <span class="label">{{ label }}</span>
          <input
            class="volt-input"
            :value="modelValue"
            :disabled="disabled"
            @input="$emit('update:modelValue', $event.target.value)"
            @keydown.enter="$emit('enter')"
          />
        </div>
      `,
    },
    Select: {
      props: ['modelValue', 'options', 'disabled'],
      emits: ['update:modelValue'],
      template: `
        <select
          class="stub-select"
          :value="modelValue"
          :disabled="disabled"
          @change="$emit('update:modelValue', $event.target.value)"
        >
          <option v-for="opt in options" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      `,
    },
    Textarea: {
      props: ['modelValue', 'placeholder', 'rows', 'disabled'],
      emits: ['update:modelValue'],
      template: '<textarea class="stub-textarea" :value="modelValue" :placeholder="placeholder" :disabled="disabled" :rows="rows" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    },
    Button: {
      props: ['variant', 'disabled', 'loading'],
      template: '<button class="stub-button" :disabled="disabled" :data-variant="variant"><slot /></button>',
    },
  }

  const createWrapper = (customProps = {}) => {
    return mount(TablePhase3, {
      props: {
        circuits: mockCircuits,
        isCircuitLocked: (c: CircuitItem) => c.id === 'c3',
        isActionLoading: {},
        isThreePhase: (c: CircuitItem) => c.banShubetsu === '動力',
        ...customProps,
      },
      global: {
        stubs: globalStubs,
      },
    })
  }

  it('三相の未完了回路では最初から常時Input表示かつ操作列は「確定」ボタンのみ表示されること', () => {
    const wrapper = createWrapper()
    const row1 = wrapper.find('.circuit-row[data-row-id="c1"]')

    // 操作列は確定ボタンのみ
    const buttons = row1.findAll('.col-actions .stub-button')

    expect(buttons.length).toBe(1)
    expect(buttons[0]?.text()).toBe('確定')
    expect(buttons[0]?.attributes('data-variant')).toBe('success')

    // 各相セルは最初から入力可能モード
    const voltCells = row1.findAll('.stub-volt-cell')

    expect(voltCells.length).toBe(3)
    expect(voltCells[0]?.attributes('data-disabled')).toBe('false')

    // 検相セルは常時Selectで初期値が「正」であること
    const select = row1.find('.col-kensou .stub-select')

    expect(select.exists()).toBe(true)
    expect((select.element as HTMLSelectElement).value).toBe('正')

    // 備考欄は常時Textareaであること
    const remarks = row1.find('.col-p3Remarks .stub-textarea')

    expect(remarks.exists()).toBe(true)
    expect(remarks.attributes('disabled')).toBeUndefined()
  })

  it('三相の未完了回路で正常電圧を入力して確定をクリックすると confirm が発火し isComplete: true となること', async () => {
    const wrapper = createWrapper()
    const row1 = wrapper.find('.circuit-row[data-row-id="c1"]')

    const voltCells = row1.findAll('.stub-volt-cell')

    // 三相200Vの±10%（180〜220V）範囲内を入力
    await voltCells[0]?.find('.volt-input').setValue('208')
    await voltCells[1]?.find('.volt-input').setValue('205')
    await voltCells[2]?.find('.volt-input').setValue('209')

    // 備考を入力
    await row1.find('.col-p3Remarks .stub-textarea').setValue('三相実測OK')

    // 確定をクリックする前は confirm は発火しないこと（確定ボタンを押すまでは送信しない、保持もしない）
    expect(wrapper.emitted('confirm')).toBeFalsy()

    // 確定をクリック
    const confirmBtn = row1.find('.col-actions .stub-button')

    await confirmBtn.trigger('click')

    expect(wrapper.emitted('confirm')).toBeTruthy()
    const emitted = wrapper.emitted('confirm')?.[0]

    expect(emitted?.[0]).toEqual(mockCircuits[0])
    expect(emitted?.[1]).toEqual({
      rs: 208,
      st: 205,
      rt: 209,
      kensou: '正',
      remarks: '三相実測OK',
      isComplete: true, // 正常範囲かつ正相なので進捗（完了）
    })
  })

  it('三相回路で検相が「逆」の場合は確定しても isComplete: false（進捗させない）となること', async () => {
    const wrapper = createWrapper()
    const row1 = wrapper.find('.circuit-row[data-row-id="c1"]')

    const voltCells = row1.findAll('.stub-volt-cell')

    await voltCells[0]?.find('.volt-input').setValue('200')
    await voltCells[1]?.find('.volt-input').setValue('200')
    await voltCells[2]?.find('.volt-input').setValue('200')

    // 検相を「逆」に変更
    const select = row1.find('.col-kensou .stub-select')

    await select.setValue('逆')

    // 確定をクリック
    const confirmBtn = row1.find('.col-actions .stub-button')

    await confirmBtn.trigger('click')

    const emitted = wrapper.emitted('confirm')?.[0]

    expect(emitted?.[1]).toEqual({
      rs: 200,
      st: 200,
      rt: 200,
      kensou: '逆',
      remarks: '',
      isComplete: false, // 逆相なので進捗させない（isComplete: false）
    })
  })

  it('単相回路で検相が「否」の場合は確定しても isComplete: false（進捗させない）となること', async () => {
    const wrapper = createWrapper()
    const row5 = wrapper.find('.circuit-row[data-row-id="c5"]')

    const voltCells = row5.findAll('.stub-volt-cell')

    // 100/200Vの正常範囲内を入力
    await voltCells[0]?.find('.volt-input').setValue('102')
    await voltCells[1]?.find('.volt-input').setValue('101')
    await voltCells[2]?.find('.volt-input').setValue('204')

    // 検相を「否」に変更
    const select = row5.find('.col-kensou .stub-select')

    await select.setValue('否')

    // 確定をクリック
    const confirmBtn = row5.find('.col-actions .stub-button')

    await confirmBtn.trigger('click')

    const emitted = wrapper.emitted('confirm')?.[0]

    expect(emitted?.[1]).toEqual({
      rs: 102,
      st: 101,
      rt: 204,
      kensou: '否',
      remarks: '',
      isComplete: false, // 点灯確認「否」なので進捗させない
    })
  })

  it('単相回路で検相が「良」かつ電圧正常の場合は isComplete: true（進捗）となること', async () => {
    const wrapper = createWrapper()
    const row5 = wrapper.find('.circuit-row[data-row-id="c5"]')

    const voltCells = row5.findAll('.stub-volt-cell')

    await voltCells[0]?.find('.volt-input').setValue('103')
    await voltCells[1]?.find('.volt-input').setValue('102')
    await voltCells[2]?.find('.volt-input').setValue('205')

    const confirmBtn = row5.find('.col-actions .stub-button')

    await confirmBtn.trigger('click')

    const emitted = wrapper.emitted('confirm')?.[0]

    expect(emitted?.[1]).toEqual({
      rs: 103,
      st: 102,
      rt: 205,
      kensou: '良',
      remarks: '',
      isComplete: true,
    })
  })

  it('配電方式を参照し、各相の測定値が±10%の範囲外の場合は確定ボタンが無効化されること', async () => {
    const wrapper = createWrapper()
    const row5 = wrapper.find('.circuit-row[data-row-id="c5"]')

    // 単相3線式 100/200V: R-N (100V ±10% -> 90〜110V)
    // 80V (90V未満) を入力
    const voltCells = row5.findAll('.stub-volt-cell')

    await voltCells[0]?.find('.volt-input').setValue('80')

    const confirmBtn = row5.find('.col-actions .stub-button')

    expect(confirmBtn.attributes('disabled')).toBeDefined()

    // 正常値 100V に修正
    await voltCells[0]?.find('.volt-input').setValue('100')
    expect(confirmBtn.attributes('disabled')).toBeUndefined()

    // 上限超過 120V (110V超) を入力
    await voltCells[0]?.find('.volt-input').setValue('120')
    expect(confirmBtn.attributes('disabled')).toBeDefined()
  })

  it('完了済み回路では入力欄がすべてdisabledになり、「解除」ボタンのみが表示されること', () => {
    const wrapper = createWrapper()
    const row2 = wrapper.find('.circuit-row[data-row-id="c2"]')

    // 操作列は解除ボタンのみ
    const buttons = row2.findAll('.col-actions .stub-button')

    expect(buttons.length).toBe(1)
    expect(buttons[0]?.text()).toBe('解除')
    expect(buttons[0]?.attributes('data-variant')).toBe('danger')

    // Input・Select・Textarea が disabled であること
    const voltCells = row2.findAll('.stub-volt-cell')

    for (const cell of voltCells) {
      expect(cell.attributes('data-disabled')).toBe('true')
    }
    expect(row2.find('.stub-select').attributes('disabled')).toBeDefined()
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
    const rCell = row2.findAll('.stub-volt-cell')[0]

    expect(rCell?.attributes('data-disabled')).toBe('false')
    expect((row2.findAll('.volt-input')[0]?.element as HTMLInputElement).value).toBe('100')

    // ボタンが「確定」に戻ること
    const buttons = row2.findAll('.col-actions .stub-button')

    expect(buttons.length).toBe(1)
    expect(buttons[0]?.text()).toBe('確定')
    expect(buttons[0]?.attributes('data-variant')).toBe('success')
  })

  it('幹線未完了の回路では「⏸ 幹線未完了」が表示され、操作ボタンが表示されないこと', () => {
    const wrapper = createWrapper()
    const row3 = wrapper.find('.circuit-row[data-row-id="c3"]')

    expect(row3.find('.col-actions .text-note').text()).toContain('⏸ 幹線未完了')
    expect(row3.findAll('.col-actions .stub-button').length).toBe(0)
    expect(row3.findAll('.stub-volt-cell')[0]?.attributes('data-disabled')).toBe('true')
  })

  it('前フェーズ（P2）未了の回路では「⏸ P2未了」が表示され、操作ボタンが表示されないこと', () => {
    const wrapper = createWrapper()
    const row4 = wrapper.find('.circuit-row[data-row-id="c4"]')

    expect(row4.find('.col-actions .text-note').text()).toContain('⏸ P2未了')
    expect(row4.findAll('.col-actions .stub-button').length).toBe(0)
  })

  it('三相と単相で相ラベル（RS/ST/RT vs RN/TN/RT）が適切に切り替わること', () => {
    const wrapper = createWrapper()
    const row1 = wrapper.find('.circuit-row[data-row-id="c1"]') // 動力（三相）
    const row5 = wrapper.find('.circuit-row[data-row-id="c5"]') // 電灯（単相）

    const labels3p = row1.findAll('.stub-volt-cell').map(c => c.attributes('data-label'))
    const labels1p = row5.findAll('.stub-volt-cell').map(c => c.attributes('data-label'))

    expect(labels3p).toEqual(['R - S', 'S - T', 'R - T'])
    expect(labels1p).toEqual(['R - N', 'T - N', 'R - T'])
  })

  it('除外回路（isExcluded: true）では確定ボタンが無効化されること', () => {
    const wrapper = createWrapper()
    const row6 = wrapper.find('.circuit-row[data-row-id="c6"]')

    const buttons = row6.findAll('.col-actions .stub-button')

    expect(buttons.length).toBe(1)
    expect(buttons[0]?.attributes('disabled')).toBeDefined()
  })
})
