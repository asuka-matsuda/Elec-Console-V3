import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PortalCalToolbar from '../../../app/components/portal/molecules/CalToolbar.vue'

describe('PortalCalToolbar.vue', () => {
  it('renders title correctly', () => {
    const wrapper = mount(PortalCalToolbar, {
      props: {
        title: '2026年9月',
        currentView: 'dayGridMonth',
      },
    })

    expect(wrapper.find('.toolbar-title').text()).toBe('2026年9月')
  })

  it('emits navigation events (prev, next, today)', async () => {
    const wrapper = mount(PortalCalToolbar, {
      props: {
        title: '2026年9月',
        currentView: 'dayGridMonth',
      },
    })

    const buttons = wrapper.findAllComponents({ name: 'Button' })

    // ボタン順: 0: prev, 1: next, 2: today, 3: openTypeSettings
    await buttons[0]?.trigger('click')
    expect(wrapper.emitted('prev')).toBeTruthy()

    await buttons[1]?.trigger('click')
    expect(wrapper.emitted('next')).toBeTruthy()

    await buttons[2]?.trigger('click')
    expect(wrapper.emitted('today')).toBeTruthy()

    await buttons[3]?.trigger('click')
    expect(wrapper.emitted('openTypeSettings')).toBeTruthy()
  })

  it('renders RadioGroup for view switching and emits changeView', async () => {
    const wrapper = mount(PortalCalToolbar, {
      props: {
        title: '2026年9月',
        currentView: 'dayGridMonth',
      },
    })

    const radioGroup = wrapper.findComponent({ name: 'RadioGroup' })

    expect(radioGroup.exists()).toBe(true)

    // リスト表示へ切り替えイベントをトリガー
    await radioGroup.vm.$emit('update:modelValue', 'listMonth')
    expect(wrapper.emitted('changeView')).toBeTruthy()
    expect(wrapper.emitted('changeView')?.[0]).toEqual(['listMonth'])
  })
})
