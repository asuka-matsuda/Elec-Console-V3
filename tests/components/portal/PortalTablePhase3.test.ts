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
    },
    {
      id: 'c2',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '電灯',
      banMeisho: '1L-1',
      kairoBangou: '1',
      kairoMeisho: '電灯回路1',
      p1Kakunin: true,
      p1Mashishime: true,
      p1ConfirmedAt: '2026-09-21T10:00:00Z',
      p2ConfirmedAt: '2026-09-21T11:00:00Z',
      p2IsComplete: true,
      denatsuRs: 100,
      denatsuSt: 100,
      denatsuRt: 200,
      kensou: '点灯確認(良)',
      p3ConfirmedAt: '2026-09-21T12:00:00Z',
      p3Worker: '佐藤 次郎',
      p3Remarks: '特記事項なし',
    },
    {
      id: 'c3',
      siteId: 'site-1',
      keiTo: '二次側',
      banShubetsu: '動力',
      banMeisho: '1P-2',
      kairoBangou: '1',
      kairoMeisho: '幹線未完了回路',
      p1Kakunin: true,
      p1Mashishime: true,
      p1ConfirmedAt: '2026-09-21T10:00:00Z',
      p2ConfirmedAt: '2026-09-21T11:00:00Z',
      p2IsComplete: true,
      p3ConfirmedAt: null,
    },
    {
      id: 'c4',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '電灯',
      banMeisho: '1L-2',
      kairoBangou: '2',
      kairoMeisho: 'P2未了回路',
      p1Kakunin: true,
      p1Mashishime: true,
      p1ConfirmedAt: '2026-09-21T10:00:00Z',
      p2ConfirmedAt: null,
      p2IsComplete: false,
      p3ConfirmedAt: null,
    },
    {
      id: 'c5',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '電灯',
      banMeisho: '1L-1',
      kairoBangou: '2',
      kairoMeisho: '単相未完了回路',
      p1Kakunin: true,
      p1Mashishime: true,
      p1ConfirmedAt: '2026-09-21T10:00:00Z',
      p2ConfirmedAt: '2026-09-21T11:00:00Z',
      p2IsComplete: true,
      p3ConfirmedAt: null,
    },
    {
      id: 'c6',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '電灯',
      banMeisho: '1L-1',
      kairoBangou: '3',
      kairoMeisho: '除外回路',
      p1Kakunin: true,
      p1Mashishime: true,
      p1ConfirmedAt: '2026-09-21T10:00:00Z',
      p2ConfirmedAt: '2026-09-21T11:00:00Z',
      p2IsComplete: true,
      isExcluded: true,
      p3ConfirmedAt: null,
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
    PortalCellPhaseMeas: {
      name: 'PortalCellPhaseMeas',
      props: ['modelValue', 'label', 'val', 'isEditing'],
      emits: ['update:modelValue', 'enter'],
      template: `
        <div class="stub-volt-cell" :data-label="label" :data-editing="isEditing">
          <span class="label">{{ label }}</span>
          <input
            v-if="isEditing"
            class="volt-input"
            :value="modelValue"
            @input="$emit('update:modelValue', $event.target.value)"
            @keydown.enter="$emit('enter')"
          />
          <span v-else class="volt-val">{{ val }}</span>
        </div>
      `,
    },
    Select: {
      props: ['modelValue', 'options'],
      emits: ['update:modelValue'],
      template: `
        <select
          class="stub-select"
          :value="modelValue"
          @change="$emit('update:modelValue', $event.target.value)"
        >
          <option v-for="opt in options" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      `,
    },
    Input: {
      props: ['modelValue', 'placeholder'],
      emits: ['update:modelValue', 'keydown'],
      template: '<input class="stub-input" :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" @keydown="$emit(\'keydown\', $event)" />',
    },
    Textarea: {
      props: ['modelValue', 'placeholder', 'rows'],
      emits: ['update:modelValue', 'keydown'],
      template: '<textarea class="stub-textarea" :value="modelValue" :placeholder="placeholder" :rows="rows" @input="$emit(\'update:modelValue\', $event.target.value)" @keydown="$emit(\'keydown\', $event)" />',
    },
    Button: {
      props: ['variant', 'disabled', 'loading'],
      template: '<button class="stub-button" :disabled="disabled" :data-variant="variant"><slot /></button>',
    },
    Badge: {
      props: ['id'],
      template: '<span class="stub-badge" :data-id="id"><slot /></span>',
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

  it('三相の未完了回路では最初からInput表示かつ「確定」ボタンが表示され、手入力して確定すると confirm が発火すること', async () => {
    const wrapper = createWrapper()
    const row1 = wrapper.find('.circuit-row[data-row-id="c1"]')

    // ボタンは「確定」1つのみ
    const buttons = row1.findAll('.col-actions .stub-button')

    expect(buttons.length).toBe(1)
    expect(buttons[0]?.text()).toBe('確定')

    // セルは最初から入力モード
    const voltCells = row1.findAll('.stub-volt-cell')

    expect(voltCells.length).toBe(3)
    expect(voltCells[0]?.attributes('data-editing')).toBe('true')

    // RS, ST, RT を手入力
    await voltCells[0]?.find('.volt-input').setValue('208')
    await voltCells[1]?.find('.volt-input').setValue('207')
    await voltCells[2]?.find('.volt-input').setValue('209')

    // 備考を入力
    const remarksInput = row1.find('.col-p3Remarks .stub-textarea')

    expect(remarksInput.exists()).toBe(true)
    await remarksInput.setValue('実測完了')

    // 確定をクリック
    await buttons[0]?.trigger('click')

    const emitted = wrapper.emitted('confirm')

    expect(emitted).toBeTruthy()
    expect(emitted?.[0]?.[0]).toEqual(mockCircuits[0])
    expect(emitted?.[0]?.[1]).toEqual({
      rs: 208,
      st: 207,
      rt: 209,
      kensou: '正相',
      remarks: '実測完了',
    })
  })

  it('単相の未完了回路で電圧を手入力して確定をクリックすると手入力値で confirm が発火すること', async () => {
    const wrapper = createWrapper()
    const row5 = wrapper.find('.circuit-row[data-row-id="c5"]')

    const voltCells = row5.findAll('.stub-volt-cell')

    expect(voltCells[0]?.attributes('data-editing')).toBe('true')

    await voltCells[0]?.find('.volt-input').setValue('104')
    await voltCells[1]?.find('.volt-input').setValue('103')
    await voltCells[2]?.find('.volt-input').setValue('207')

    const confirmBtn = row5.find('.col-actions .stub-button')

    expect(confirmBtn.text()).toBe('確定')
    await confirmBtn.trigger('click')

    const emitted = wrapper.emitted('confirm')

    expect(emitted).toBeTruthy()
    expect(emitted?.[0]?.[0]).toEqual(mockCircuits[4])
    expect(emitted?.[0]?.[1]).toEqual({
      rs: 104,
      st: 103,
      rt: 207,
      kensou: '点灯確認(良)',
      remarks: '',
    })
  })

  it('完了済み回路では通常表示となり「解除」「変更」ボタンが表示され、解除クリックで clear が発火すること', async () => {
    const wrapper = createWrapper()
    const row2 = wrapper.find('.circuit-row[data-row-id="c2"]')

    // 完了回路はInput表示ではなく通常表示
    const voltCells = row2.findAll('.stub-volt-cell')

    expect(voltCells[0]?.attributes('data-editing')).toBe('false')

    const buttons = row2.findAll('.col-actions .stub-button')

    expect(buttons.length).toBe(2)
    expect(buttons[0]?.text()).toBe('解除')
    expect(buttons[1]?.text()).toBe('変更')

    await buttons[0]?.trigger('click')

    const emitted = wrapper.emitted('clear')

    expect(emitted).toBeTruthy()
    expect(emitted?.[0]?.[0]).toEqual(mockCircuits[1])
  })

  it('幹線未完了の回路では「⏸ 幹線未完了」が表示され、操作ボタンおよび入力欄が表示されないこと', () => {
    const wrapper = createWrapper()
    const row3 = wrapper.find('.circuit-row[data-row-id="c3"]')

    expect(row3.find('.col-actions .text-note').text()).toContain('⏸ 幹線未完了')
    expect(row3.findAll('.col-actions .stub-button').length).toBe(0)
    expect(row3.findAll('.stub-volt-cell')[0]?.attributes('data-editing')).toBe('false')
  })

  it('前フェーズ（P2）未了の回路では「⏸ P2未了」が表示され、操作ボタンが表示されないこと', () => {
    const wrapper = createWrapper()
    const row4 = wrapper.find('.circuit-row[data-row-id="c4"]')

    expect(row4.find('.col-actions .text-note').text()).toContain('⏸ P2未了')
    expect(row4.findAll('.col-actions .stub-button').length).toBe(0)
  })

  it('完了済み回路で「変更」クリックで編集モードに突入し、各相電圧を入力して「保存」で confirm が発火すること', async () => {
    const wrapper = createWrapper()
    const row2 = wrapper.find('.circuit-row[data-row-id="c2"]')

    // 「変更」をクリック
    const changeBtn = row2.findAll('.col-actions .stub-button')[1]

    expect(changeBtn?.text()).toBe('変更')
    await changeBtn?.trigger('click')

    // 編集用ボタン「保存」「取消」が表示される
    const editButtons = row2.findAll('.col-actions .stub-button')

    expect(editButtons.length).toBe(2)
    expect(editButtons[0]?.text()).toBe('保存')
    expect(editButtons[1]?.text()).toBe('取消')

    // セルが入力モードになること
    const voltCells = row2.findAll('.stub-volt-cell')

    expect(voltCells[0]?.attributes('data-editing')).toBe('true')

    // RS相を 105 に変更
    await voltCells[0]?.find('.volt-input').setValue('105')

    // 保存クリック
    await editButtons[0]?.trigger('click')

    const emitted = wrapper.emitted('confirm')

    expect(emitted).toBeTruthy()
    expect(emitted?.[0]?.[1]).toEqual({
      rs: 105,
      st: 100,
      rt: 200,
      kensou: '点灯確認(良)',
      remarks: '特記事項なし',
    })
  })

  it('完了済み回路の変更中に「取消」をクリックすると編集モードが終了すること', async () => {
    const wrapper = createWrapper()
    const row2 = wrapper.find('.circuit-row[data-row-id="c2"]')

    await row2.findAll('.col-actions .stub-button')[1]?.trigger('click')

    const editButtons = row2.findAll('.col-actions .stub-button')

    expect(editButtons[1]?.text()).toBe('取消')

    await editButtons[1]?.trigger('click')

    // 通常モードに戻っていること
    expect(row2.findAll('.col-actions .stub-button')[0]?.text()).toBe('解除')
    expect(row2.findAll('.col-actions .stub-button')[1]?.text()).toBe('変更')
    expect(row2.findAll('.stub-volt-cell')[0]?.attributes('data-editing')).toBe('false')
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

  it('除外回路（isExcluded: true）ではボタンが disabled になり、セルも非編集モードになること', () => {
    const wrapper = createWrapper()
    const row6 = wrapper.find('.circuit-row[data-row-id="c6"]')

    const buttons = row6.findAll('.col-actions .stub-button')

    expect(buttons.length).toBe(1)
    expect(buttons[0]?.attributes('disabled')).toBeDefined()
    expect(row6.findAll('.stub-volt-cell')[0]?.attributes('data-editing')).toBe('false')
  })
})
