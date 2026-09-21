import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SiteBasicSettings from '../../../app/components/portal/molecules/SiteBasicSettings.vue'

describe('PortalSiteBasicSettings', () => {
  const baseProps = {
    editStatus: 'in_progress',
    editId: 'site-a',
    name: '新宿現場',
    statusOptions: [
      { label: '進行中', value: 'in_progress' },
      { label: '計画中', value: 'planning' },
    ],
    workerNames: ['山田 太郎', '佐藤 次郎'],
  }

  it('renders inputs and worker badges correctly', () => {
    const wrapper = mount(SiteBasicSettings, {
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
    const wrapper = mount(SiteBasicSettings, {
      props: {
        ...baseProps,
        workerNames: [],
      },
    })

    expect(wrapper.text()).toContain('アサインされている作業者はいません')
  })

  it('emits update events on inputs change', async () => {
    const wrapper = mount(SiteBasicSettings, {
      props: baseProps,
    })

    const inputs = wrapper.findAllComponents({ name: 'Input' })
    const select = wrapper.findComponent({ name: 'Select' })

    await select.vm.$emit('update:modelValue', 'completed')
    expect(wrapper.emitted('update:editStatus')?.[0]).toEqual(['completed'])

    await inputs[0].vm.$emit('update:modelValue', 'site-b')
    expect(wrapper.emitted('update:editId')?.[0]).toEqual(['site-b'])

    await inputs[1].vm.$emit('update:modelValue', '渋谷現場')
    expect(wrapper.emitted('update:name')?.[0]).toEqual(['渋谷現場'])
  })
})
