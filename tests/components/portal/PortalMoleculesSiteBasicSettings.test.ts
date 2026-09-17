import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MoleculesSiteBasicSettings from '../../../app/components/portal/MoleculesSiteBasicSettings.vue'

describe('MoleculesSiteBasicSettings.vue', () => {
  const baseProps = {
    editStatus: 'in_progress',
    editId: 'site-a',
    editData: { name: '新宿現場' },
    statusOptions: [
      { label: '進行中', value: 'in_progress' },
      { label: '計画中', value: 'planning' },
    ],
    workerNames: ['山田 太郎', '佐藤 次郎'],
  }

  it('renders inputs and worker badges correctly', () => {
    const wrapper = mount(MoleculesSiteBasicSettings, {
      props: baseProps,
    })

    expect(wrapper.text()).toContain('現場基本情報')
    expect(wrapper.text()).toContain('ステータス')
    expect(wrapper.text()).toContain('現場ID (半角英数)')
    expect(wrapper.text()).toContain('現場名')
    expect(wrapper.text()).toContain('山田 太郎')
    expect(wrapper.text()).toContain('佐藤 次郎')
  })

  it('renders empty state when workerNames is empty', () => {
    const wrapper = mount(MoleculesSiteBasicSettings, {
      props: {
        ...baseProps,
        workerNames: [],
      },
    })

    expect(wrapper.text()).toContain('アサインされている作業者はいません')
  })
})
