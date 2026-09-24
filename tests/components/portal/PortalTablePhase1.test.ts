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
    {
      id: 'c4',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '電灯',
      banMeisho: '1L-1',
      kairoBangou: '3',
      kairoMeisho: '電灯回路3（片方確定）',
      cableList: 'VVF 1.6-2C',
      p1Kakunin: true,
      p1Mashishime: false,
      p1ConfirmedAt: '2026-09-21T10:00:00Z',
      p1Worker: '山田 太郎',
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

  it('未完了の回路と完了済みの回路の確認・増締チェックボックスが正しく描画され、チェック操作単体ではAPIイベントが発火しないこと', async () => {
    const wrapper = createWrapper()
    const rows = wrapper.findAll('.circuit-row')

    expect(rows.length).toBe(4)

    // c1 (未完了: kakunin: false, mashishime: false)
    const checkboxes1 = rows[0]?.findAll('.col-p1Kakunin input[type="checkbox"]')

    expect(checkboxes1.length).toBe(2)
    expect((checkboxes1[0].element as HTMLInputElement).checked).toBe(false)
    expect((checkboxes1[1].element as HTMLInputElement).checked).toBe(false)

    // c2 (完了済み: kakunin: true, mashishime: true)
    const checkboxes2 = rows[1]?.findAll('.col-p1Kakunin input[type="checkbox"]')

    expect(checkboxes2.length).toBe(2)
    expect((checkboxes2[0].element as HTMLInputElement).checked).toBe(true)
    expect((checkboxes2[1].element as HTMLInputElement).checked).toBe(true)

    // c1の「確認」チェックボックスをクリック（単体クリックでは測定者上書き防止のためAPIイベントを発火しない）
    await checkboxes1[0].setValue(true)
    expect(wrapper.emitted('update-check')).toBeFalsy()
  })

  it('片方だけチェックを入れた状態で確定をクリックすると、片方チェックと備考付きで confirm が発火すること', async () => {
    const wrapper = createWrapper()
    const row1 = wrapper.find('.circuit-row[data-row-id="c1"]')

    const checkboxes = row1.findAll('.col-p1Kakunin input[type="checkbox"]')
    const buttons = row1.findAll('.stub-button')

    // 「確認」のみチェック
    await checkboxes[0].setValue(true)

    await buttons[0]?.trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
    expect(wrapper.emitted('confirm')?.[0]?.[0]).toEqual(mockCircuits[0])
    expect(wrapper.emitted('confirm')?.[0]?.[1]).toEqual({
      kakunin: true,
      mashishime: false,
      remarks: '特記事項なし',
    })
  })

  it('完了済み回路では「解除」ボタンが表示され、確定中は入力が無効化（disabled）され、解除すると入力可能になること', async () => {
    const wrapper = createWrapper()
    const row2 = wrapper.find('.circuit-row[data-row-id="c2"]')

    // 確定済み状態ではチェックボックスもテキストエリアも disabled であること
    const checkboxesBefore = row2.findAll('.col-p1Kakunin input[type="checkbox"]')
    const textareaBefore = row2.find('.col-p1Remarks .stub-textarea')

    expect((checkboxesBefore[0].element as HTMLInputElement).disabled).toBe(true)
    expect((checkboxesBefore[1].element as HTMLInputElement).disabled).toBe(true)
    expect((textareaBefore.element as HTMLTextAreaElement).disabled).toBe(true)

    const buttons = row2.findAll('.stub-button')

    expect(buttons.length).toBe(1)
    expect(buttons[0]?.text()).toBe('解除')
    expect(buttons[0]?.attributes('data-variant')).toBe('danger')

    // 解除をクリック
    await buttons[0]?.trigger('click')

    // サーバーへ clear イベントは送らない
    expect(wrapper.emitted('clear')).toBeFalsy()

    // 操作列が「確定」ボタンに切り替わること（編集ボタンは廃止され1つのみ）
    const newButtons = row2.findAll('.stub-button')

    expect(newButtons.length).toBe(1)
    expect(newButtons[0]?.text()).toBe('確定')

    // 解除後は disabled が解除され、チェック値や備考は保持されていること
    const checkboxesAfter = row2.findAll('.col-p1Kakunin input[type="checkbox"]')
    const textareaAfter = row2.find('.col-p1Remarks .stub-textarea')

    expect((checkboxesAfter[0].element as HTMLInputElement).disabled).toBe(false)
    expect((checkboxesAfter[1].element as HTMLInputElement).disabled).toBe(false)
    expect((textareaAfter.element as HTMLTextAreaElement).disabled).toBe(false)
    expect((checkboxesAfter[0].element as HTMLInputElement).checked).toBe(true)
    expect((checkboxesAfter[1].element as HTMLInputElement).checked).toBe(true)
  })

  it('片方だけチェックを入れて確定済みの回路でも「解除」ボタンが表示され、解除後に再度確定を押すと confirm が発火すること', async () => {
    const wrapper = createWrapper()
    const row4 = wrapper.find('.circuit-row[data-row-id="c4"]')

    const buttons = row4.findAll('.stub-button')

    expect(buttons.length).toBe(1)
    expect(buttons[0]?.text()).toBe('解除')
    expect(buttons[0]?.attributes('data-variant')).toBe('danger')

    // 解除をクリック
    await buttons[0]?.trigger('click')
    expect(wrapper.emitted('clear')).toBeFalsy()

    // 確定ボタンに切り替わる
    const confirmBtn = row4.findAll('.stub-button')[0]

    expect(confirmBtn?.text()).toBe('確定')

    // 再度確定をクリックすると保持されたチェック値で confirm が発火
    await confirmBtn?.trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
    expect(wrapper.emitted('confirm')?.[0]?.[0]).toEqual(mockCircuits[3])
    expect(wrapper.emitted('confirm')?.[0]?.[1]).toEqual({ kakunin: true, mashishime: false, remarks: '' })
  })

  it('幹線未完了でロックされている回路では「⏸ 幹線未完了」が表示され操作ボタンが表示されないこと', () => {
    const wrapper = createWrapper()
    const row3 = wrapper.find('.circuit-row[data-row-id="c3"]')

    expect(row3.find('.text-note').text()).toContain('⏸ 幹線未完了')
    expect(row3.findAll('.stub-button').length).toBe(0)
  })

  it('最初から備考欄にTextareaが表示され、備考を入力して確定を押すと remarks 付きで confirm が発火すること', async () => {
    const wrapper = createWrapper()
    const row1 = wrapper.find('.circuit-row[data-row-id="c1"]')

    // 備考欄は最初から Textarea が描画されていること
    const remarksTextarea = row1.find('.col-p1Remarks .stub-textarea')

    expect(remarksTextarea.exists()).toBe(true)
    expect((remarksTextarea.element as HTMLTextAreaElement).value).toBe('特記事項なし')

    // 備考を不備内容に書き換えて確定
    await remarksTextarea.setValue('圧着端子サイズ不一致のため要改修')
    const confirmBtn = row1.find('.stub-button')

    await confirmBtn.trigger('click')

    expect(wrapper.emitted('confirm')).toBeTruthy()
    expect(wrapper.emitted('confirm')?.[0]?.[1]).toEqual({
      kakunin: false,
      mashishime: false,
      remarks: '圧着端子サイズ不一致のため要改修',
    })
  })

  it('編集ボタンは廃止され、未確定時は「確定」ボタンのみ表示されること', () => {
    const wrapper = createWrapper()
    const row1 = wrapper.find('.circuit-row[data-row-id="c1"]')
    const buttons = row1.findAll('.stub-button')

    expect(buttons.length).toBe(1)
    expect(buttons[0]?.text()).toBe('確定')
  })

  it('除外回路（isExcluded: true）では確定ボタンが無効化されること', () => {
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

    expect(buttons.length).toBe(1)
    expect(buttons[0]?.attributes('disabled')).toBeDefined()
  })
})
