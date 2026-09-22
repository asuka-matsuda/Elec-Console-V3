import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CellSoudenActions from '../../../app/components/portal/exam/CellSoudenActions.vue'
import type { CircuitItem } from '../../../app/types/souden'

describe('CellSoudenActions.vue', () => {
  const dummyCircuit: CircuitItem = {
    id: 'c1',
    siteId: 'site-1',
    keiTo: '幹線',
    banShubetsu: '電灯',
    banMeisho: '1L-1',
    kairoBangou: '1',
    kairoMeisho: '回路1',
    cableList: '',
    haisenJousuu: '',
    setsuchiList: '',
    p1Kakunin: false,
    p1Mashishime: false,
    p1ConfirmedAt: null,
    p1Worker: null,
    p1Remarks: '',
    p2IsComplete: false,
    p2ConfirmedAt: null,
    p2Worker: null,
    p2Remarks: '',
    p3ConfirmedAt: null,
    p3Worker: null,
    p3Remarks: '',
    isExcluded: false,
  }

  const globalStubs = {
    Button: {
      props: ['variant', 'disabled', 'loading'],
      template: '<button class="stub-button" :disabled="disabled" :data-variant="variant"><slot /></button>',
    },
  }

  it('ロック状態の時に指定された理由が表示されること', () => {
    const wrapper = mount(CellSoudenActions, {
      props: {
        circuit: dummyCircuit,
        isLocked: true,
        lockedReason: '幹線未完了',
      },
      global: { stubs: globalStubs },
    })

    expect(wrapper.text()).toContain('⏸ 幹線未完了')
    expect(wrapper.findAll('.stub-button').length).toBe(0)
  })

  it('編集中モードの時に保存・取消ボタンが表示されイベントが発火すること', async () => {
    const wrapper = mount(CellSoudenActions, {
      props: {
        circuit: dummyCircuit,
        isEditing: true,
        saveLabel: '確定',
      },
      global: { stubs: globalStubs },
    })

    const buttons = wrapper.findAll('.stub-button')

    expect(buttons.length).toBe(2)
    expect(buttons[0]?.text()).toBe('確定')
    expect(buttons[1]?.text()).toBe('取消')

    await buttons[0]?.trigger('click')
    expect(wrapper.emitted('save')).toBeTruthy()

    await buttons[1]?.trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('完了済み状態の時に解除ボタンが表示されイベントが発火すること', async () => {
    const wrapper = mount(CellSoudenActions, {
      props: {
        circuit: dummyCircuit,
        isCompleted: true,
        hasModifyButton: true,
      },
      global: { stubs: globalStubs },
    })

    const buttons = wrapper.findAll('.stub-button')

    expect(buttons.length).toBe(2)
    expect(buttons[0]?.text()).toBe('解除')
    expect(buttons[1]?.text()).toBe('変更')

    await buttons[0]?.trigger('click')
    expect(wrapper.emitted('clear')).toBeTruthy()

    await buttons[1]?.trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
  })

  it('hasModifyButton が false の時は変更ボタンが表示されないこと', () => {
    const wrapper = mount(CellSoudenActions, {
      props: {
        circuit: dummyCircuit,
        isCompleted: true,
        hasModifyButton: false,
      },
      global: { stubs: globalStubs },
    })

    const buttons = wrapper.findAll('.stub-button')

    expect(buttons.length).toBe(1)
    expect(buttons[0]?.text()).toBe('解除')
  })

  it('未完了の時に確定ボタンと編集ボタンが表示され、除外時は非活性になること', async () => {
    const excludedCircuit = { ...dummyCircuit, isExcluded: true }
    const wrapper = mount(CellSoudenActions, {
      props: {
        circuit: excludedCircuit,
        confirmLabel: '標準値確定',
        editLabel: '手入力',
      },
      global: { stubs: globalStubs },
    })

    const buttons = wrapper.findAll('.stub-button')

    expect(buttons.length).toBe(2)
    expect(buttons[0]?.text()).toBe('標準値確定')
    expect(buttons[1]?.text()).toBe('手入力')
    expect(buttons[0]?.attributes('disabled')).toBeDefined()
    expect(buttons[1]?.attributes('disabled')).toBeDefined()
  })
})
