import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PortalOperationLogsFilter from '../../../app/components/portal/molecules/OperationLogsFilter.vue'

describe('PortalOperationLogsFilter.vue', () => {
  const defaultProps = {
    workerOptions: [{ label: '全作業者', value: 'ALL' }, { label: '田中', value: '田中' }],
    actionOptions: [{ label: '全アクション', value: 'ALL' }, { label: '確認', value: '確認' }],
    targetBanOptions: [{ label: '全盤', value: 'ALL' }, { label: '盤A', value: '盤A' }],
    logCount: 42,
  }

  it('renders filter labels and log count correctly', () => {
    const wrapper = mount(PortalOperationLogsFilter, {
      props: defaultProps,
      global: {
        stubs: {
          Panel: { template: '<div><slot /></div>' },
          Select: { template: '<div class="stub-select" />' },
        },
      },
    })

    const labels = wrapper.findAll('.filter-label')

    expect(labels.length).toBe(4)
    expect(labels[0]?.text()).toBe('作業者:')
    expect(labels[1]?.text()).toBe('アクション:')
    expect(labels[2]?.text()).toBe('盤:')
    expect(labels[3]?.text()).toBe('表示件数:')

    const count = wrapper.find('.filter-count')

    expect(count.text()).toContain('42')
  })

  it('updates worker model on change', async () => {
    const wrapper = mount(PortalOperationLogsFilter, {
      props: {
        ...defaultProps,
        'worker': 'ALL',
        'onUpdate:worker': (val: string) => wrapper.setProps({ worker: val }),
      },
      global: {
        stubs: {
          Panel: { template: '<div><slot /></div>' },
          Select: {
            props: ['modelValue'],
            template: '<div class="stub-select" @click="$emit(\'update:modelValue\', \'田中\')" />',
          },
        },
      },
    })

    const selects = wrapper.findAll('.stub-select')

    await selects[0]?.trigger('click')

    expect(wrapper.emitted('update:worker')?.[0]).toEqual(['田中'])
  })

  it('updates limit model on change', async () => {
    const wrapper = mount(PortalOperationLogsFilter, {
      props: {
        ...defaultProps,
        'limit': 100,
        'onUpdate:limit': (val: number) => wrapper.setProps({ limit: val }),
      },
      global: {
        stubs: {
          Panel: { template: '<div><slot /></div>' },
          Select: {
            props: ['modelValue'],
            template: '<div class="stub-select" @click="$emit(\'update:modelValue\', 50)" />',
          },
        },
      },
    })

    const selects = wrapper.findAll('.stub-select')

    await selects[3]?.trigger('click')

    expect(wrapper.emitted('update:limit')?.[0]).toEqual([50])
  })
})
