import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ToolHistoryCard from '../../app/components/tool/organisms/HistoryCard.vue'
import type { HistoryEntry } from '../../app/types/history'

describe('ToolHistoryCard.vue', () => {
  const commonStubs = {
    Panel: {
      template: '<article class="panel-stub"><slot /></article>',
    },
    Badge: {
      template: '<span class="badge-stub"><slot /></span>',
    },
    Button: {
      props: ['variant', 'iconOnly'],
      template: '<button class="button-stub"><slot /></button>',
    },
    Icon: {
      props: ['name', 'size'],
      template: '<i class="icon-stub" />',
    },
    ToolVoltageResult: {
      props: ['inputs', 'result', 'size'],
      template: '<div class="voltage-result-stub">電圧降下結果: {{ result?.optimal?.size || result?.dropV }}</div>',
    },
    ToolConduitResult: {
      props: ['inputs', 'result', 'size'],
      template: '<div class="conduit-result-stub">配管結果</div>',
    },
    ToolRackResult: {
      props: ['result', 'maxDepth', 'mode'],
      template: '<div class="rack-result-stub">ラック結果</div>',
    },
    ToolWeightResult: {
      props: ['result'],
      template: '<div class="weight-result-stub">重量結果</div>',
    },
  }

  const baseEntry: HistoryEntry = {
    id: 'test-1',
    toolId: 'voltage',
    toolName: '電圧降下・ケーブルサイズ選定',
    mode: 'サイズ選定',
    timestamp: '2026/09/10 12:00:00',
    status: 'success',
    mainResultText: '38 sq',
    inputs: [
      { label: '線路長', value: '50 m' },
      { label: '負荷電流', value: '100 A' },
    ],
    results: [
      { label: '選定ケーブルサイズ', value: '38 sq', isMain: true },
    ],
  }

  it('renders header, inputs and fallback results when raw data is not provided', () => {
    const wrapper = mount(ToolHistoryCard, {
      props: {
        entry: baseEntry,
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('電圧降下・ケーブルサイズ選定')
    expect(wrapper.text()).toContain('サイズ選定')
    expect(wrapper.text()).toContain('2026/09/10 12:00:00')
    expect(wrapper.text()).toContain('線路長')
    expect(wrapper.text()).toContain('50 m')
    expect(wrapper.text()).toContain('選定ケーブルサイズ')
    expect(wrapper.text()).toContain('38 sq')
  })

  it('emits delete event with entry id when delete button is clicked', async () => {
    const wrapper = mount(ToolHistoryCard, {
      props: {
        entry: baseEntry,
      },
      global: {
        stubs: commonStubs,
      },
    })

    const deleteBtn = wrapper.find('footer button')

    expect(deleteBtn.exists()).toBe(true)

    await deleteBtn.trigger('click')
    expect(wrapper.emitted('delete')).toEqual([['test-1']])
  })

  it('renders ToolVoltageResult and correctly maps VoltageFormState to inputs', () => {
    const voltageEntry: HistoryEntry = {
      ...baseEntry,
      toolId: 'voltage',
      rawInputs: {
        mode: 'size',
        phase: '3P3W200V',
        loadValue: 100,
        loadUnit: 'A',
        powerFactor: '0.8',
        distance: 50,
        category: 'CV',
        cores: '3C',
        cableIdx: '',
        parallel: '1',
        derating: '1.0',
        ambientTemp: 'none',
        targetDrop: '2.0',
      },
      rawResult: {
        optimal: {
          size: 38,
          name: 'CV 38sq-3C',
        },
      },
    }

    const wrapper = mount(ToolHistoryCard, {
      props: {
        entry: voltageEntry,
      },
      global: {
        stubs: commonStubs,
      },
    })

    const voltageResultStub = wrapper.find('.voltage-result-stub')

    expect(voltageResultStub.exists()).toBe(true)
    expect(voltageResultStub.text()).toContain('38')
  })

  it('renders ToolConduitResult for conduit tool', () => {
    const conduitEntry: HistoryEntry = {
      ...baseEntry,
      toolId: 'conduit',
      toolName: '電線管サイズ選定',
      rawInputs: { category: 'thin' },
      rawResult: { success: true },
    }

    const wrapper = mount(ToolHistoryCard, {
      props: {
        entry: conduitEntry,
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('.conduit-result-stub').exists()).toBe(true)
  })

  it('renders ToolRackResult for rack tool', () => {
    const rackEntry: HistoryEntry = {
      ...baseEntry,
      toolId: 'rack',
      toolName: 'ケーブルラック選定',
      rawInputs: { mode: 'strong', maxDepth: 80 },
      rawResult: { tier1: {} },
    }

    const wrapper = mount(ToolHistoryCard, {
      props: {
        entry: rackEntry,
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('.rack-result-stub').exists()).toBe(true)
  })

  it('renders ToolWeightResult for weight tool', () => {
    const weightEntry: HistoryEntry = {
      ...baseEntry,
      toolId: 'weight',
      toolName: 'ケーブル重量計算',
      rawInputs: {},
      rawResult: { totalWeight: 500 },
    }

    const wrapper = mount(ToolHistoryCard, {
      props: {
        entry: weightEntry,
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('.weight-result-stub').exists()).toBe(true)
  })
})
