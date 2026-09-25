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

  it('ロック状態の時に指定された理由が表示されボタンは表示されないこと', () => {
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

  it('完了済み（確定済み）状態の時に解除ボタンが表示され、クリックで clear が発火すること', async () => {
    const wrapper = mount(CellSoudenActions, {
      props: {
        circuit: dummyCircuit,
        isCompleted: true,
      },
      global: { stubs: globalStubs },
    })

    const buttons = wrapper.findAll('.stub-button')

    expect(buttons.length).toBe(1)
    expect(buttons[0]?.text()).toBe('解除')
    expect(buttons[0]?.attributes('data-variant')).toBe('danger')

    await buttons[0]?.trigger('click')
    expect(wrapper.emitted('clear')).toBeTruthy()
  })

  it('未完了の時に確定ボタンが表示され、クリックで confirm が発火すること', async () => {
    const wrapper = mount(CellSoudenActions, {
      props: {
        circuit: dummyCircuit,
        isCompleted: false,
        confirmLabel: '確定',
      },
      global: { stubs: globalStubs },
    })

    const buttons = wrapper.findAll('.stub-button')

    expect(buttons.length).toBe(1)
    expect(buttons[0]?.text()).toBe('確定')
    expect(buttons[0]?.attributes('data-variant')).toBe('success')

    await buttons[0]?.trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('除外回路または disabled 時は確定ボタンが無効化されること', () => {
    const excludedCircuit = { ...dummyCircuit, isExcluded: true }
    const wrapperExcluded = mount(CellSoudenActions, {
      props: {
        circuit: excludedCircuit,
      },
      global: { stubs: globalStubs },
    })

    const btn1 = wrapperExcluded.find('.stub-button')

    expect(btn1.attributes('disabled')).toBeDefined()

    const wrapperDisabled = mount(CellSoudenActions, {
      props: {
        circuit: dummyCircuit,
        disabled: true,
      },
      global: { stubs: globalStubs },
    })

    const btn2 = wrapperDisabled.find('.stub-button')

    expect(btn2.attributes('disabled')).toBeDefined()
  })

  it('スロットに渡された追加アクション（全相OKボタン等）が表示されること', () => {
    const wrapper = mount(CellSoudenActions, {
      props: {
        circuit: dummyCircuit,
      },
      slots: {
        default: '<button class="extra-btn">全相OK</button>',
      },
      global: { stubs: globalStubs },
    })

    expect(wrapper.find('.extra-btn').exists()).toBe(true)
    expect(wrapper.find('.stub-button').text()).toBe('確定')
  })
})
