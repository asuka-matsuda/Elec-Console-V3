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
    Button: {
      props: ['variant', 'disabled', 'loading'],
      template: '<button class="stub-button" :disabled="disabled" :data-variant="variant"><slot /></button>',
    },
    Textarea: {
      props: ['modelValue', 'placeholder', 'rows'],
      emits: ['update:modelValue'],
      template: '<textarea class="stub-textarea" :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
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

  it('三相の未完了回路では「標準値確定」「手入力」ボタンが表示され、標準値確定で 200V / 正相 の confirm が発火すること', async () => {
    const wrapper = createWrapper()
    const row1 = wrapper.find('.circuit-row[data-row-id="c1"]')

    const buttons = row1.findAll('.col-actions .stub-button')

    expect(buttons.length).toBe(2)
    expect(buttons[0]?.text()).toBe('標準値確定')
    expect(buttons[1]?.text()).toBe('手入力')

    await buttons[0]?.trigger('click')

    const emitted = wrapper.emitted('confirm')

    expect(emitted).toBeTruthy()
    expect(emitted?.[0]?.[0]).toEqual(mockCircuits[0])
    expect(emitted?.[0]?.[1]).toEqual({
      rs: 200,
      st: 200,
      rt: 200,
      kensou: '正相',
    })
  })

  it('単相の未完了回路で標準値確定をクリックすると 100V / 100V / 200V / 点灯確認(良) で confirm が発火すること', async () => {
    const wrapper = createWrapper()
    const row5 = wrapper.find('.circuit-row[data-row-id="c5"]')

    const buttons = row5.findAll('.col-actions .stub-button')

    await buttons[0]?.trigger('click')

    const emitted = wrapper.emitted('confirm')

    expect(emitted).toBeTruthy()
    expect(emitted?.[0]?.[0]).toEqual(mockCircuits[4])
    expect(emitted?.[0]?.[1]).toEqual({
      rs: 100,
      st: 100,
      rt: 200,
      kensou: '点灯確認(良)',
    })
  })

  it('完了済み回路では「解除」「変更」ボタンが表示され、解除クリックで clear が発火すること', async () => {
    const wrapper = createWrapper()
    const row2 = wrapper.find('.circuit-row[data-row-id="c2"]')

    const buttons = row2.findAll('.col-actions .stub-button')

    expect(buttons.length).toBe(2)
    expect(buttons[0]?.text()).toBe('解除')
    expect(buttons[1]?.text()).toBe('変更')

    await buttons[0]?.trigger('click')

    const emitted = wrapper.emitted('clear')

    expect(emitted).toBeTruthy()
    expect(emitted?.[0]?.[0]).toEqual(mockCircuits[1])
  })

  it('幹線未完了の回路では「⏸ 幹線未完了」が表示され、操作ボタンが表示されないこと', () => {
    const wrapper = createWrapper()
    const row3 = wrapper.find('.circuit-row[data-row-id="c3"]')

    expect(row3.find('.col-actions .text-note').text()).toContain('⏸ 幹線未完了')
    expect(row3.findAll('.col-actions .stub-button').length).toBe(0)
  })

  it('前フェーズ（P2）未了の回路では「⏸ P2未了」が表示され、操作ボタンが表示されないこと', () => {
    const wrapper = createWrapper()
    const row4 = wrapper.find('.circuit-row[data-row-id="c4"]')

    expect(row4.find('.col-actions .text-note').text()).toContain('⏸ P2未了')
    expect(row4.findAll('.col-actions .stub-button').length).toBe(0)
  })

  it('「手入力」クリックで編集モードに突入し、各相電圧・検相・備考を入力して「確定」で confirm が発火すること', async () => {
    const wrapper = createWrapper()
    const row1 = wrapper.find('.circuit-row[data-row-id="c1"]')

    // 手入力開始
    const buttons = row1.findAll('.col-actions .stub-button')

    await buttons[1]?.trigger('click')

    // 編集用ボタン「確定」「取消」が表示される
    const editButtons = row1.findAll('.col-actions .stub-button')

    expect(editButtons.length).toBe(2)
    expect(editButtons[0]?.text()).toBe('確定')
    expect(editButtons[1]?.text()).toBe('取消')

    // セルに入力フィールドが表示されていること
    const voltCells = row1.findAll('.stub-volt-cell')

    expect(voltCells.length).toBe(3)
    expect(voltCells[0]?.attributes('data-editing')).toBe('true')

    // RS相を 205 に変更
    const rsInput = voltCells[0]?.find('.volt-input')

    await rsInput?.setValue('205')

    // ST相を 204 に変更
    const stInput = voltCells[1]?.find('.volt-input')

    await stInput?.setValue('204')

    // 備考を入力
    const textarea = row1.find('.stub-textarea')

    await textarea.setValue('測定値正常')

    // 確定クリック
    await editButtons[0]?.trigger('click')

    const emitted = wrapper.emitted('confirm')

    expect(emitted).toBeTruthy()
    expect(emitted?.[0]?.[1]).toEqual({
      rs: 205,
      st: 204,
      rt: 200,
      kensou: '正相',
      remarks: '測定値正常',
    })

    // 編集モードが終了していること
    expect(row1.find('.col-actions .stub-button')?.text()).toBe('標準値確定')
  })

  it('手入力モード中に「取消」をクリックすると編集モードが終了すること', async () => {
    const wrapper = createWrapper()
    const row1 = wrapper.find('.circuit-row[data-row-id="c1"]')

    await row1.findAll('.col-actions .stub-button')[1]?.trigger('click')

    const editButtons = row1.findAll('.col-actions .stub-button')

    expect(editButtons[1]?.text()).toBe('取消')

    await editButtons[1]?.trigger('click')

    // 通常モードに戻っていること
    expect(row1.findAll('.col-actions .stub-button')[0]?.text()).toBe('標準値確定')
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

  it('除外回路（isExcluded: true）ではボタンが disabled になること', () => {
    const wrapper = createWrapper()
    const row6 = wrapper.find('.circuit-row[data-row-id="c6"]')

    const buttons = row6.findAll('.col-actions .stub-button')

    expect(buttons.length).toBe(2)
    expect(buttons[0]?.attributes('disabled')).toBeDefined()
    expect(buttons[1]?.attributes('disabled')).toBeDefined()
  })
})
