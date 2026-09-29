import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ToolResultDrawer from '../../../app/components/tool/ResultDrawer.vue'

describe('ToolResultDrawer.vue', () => {
  const commonStubs = {
    Icon: {
      props: ['name', 'size'],
      template: '<i class="icon-stub" />',
    },
  }

  it('renders slot content correctly', () => {
    const wrapper = mount(ToolResultDrawer, {
      slots: {
        default: '<div class="test-content">計算結果の内容</div>',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('計算結果を見る')
    expect(wrapper.text()).toContain('計算結果の内容')
  })

  it('toggles drawer state when handle button is clicked', async () => {
    const wrapper = mount(ToolResultDrawer, {
      global: {
        stubs: commonStubs,
      },
    })

    const handle = wrapper.find('button.handle')
    const section = wrapper.find('section.result-drawer')

    expect(section.classes()).not.toContain('is-open')
    expect(wrapper.find('.overlay').exists()).toBe(false)

    // 1回目クリック: 開く
    await handle.trigger('click')

    expect(section.classes()).toContain('is-open')
    expect(wrapper.find('.overlay').exists()).toBe(true)
    expect(wrapper.text()).toContain('結果を閉じる')

    // 2回目クリック: 閉じる
    await handle.trigger('click')

    expect(section.classes()).not.toContain('is-open')
    expect(wrapper.find('.overlay').exists()).toBe(false)
    expect(wrapper.text()).toContain('計算結果を見る')
  })

  it('closes drawer when overlay is clicked', async () => {
    const wrapper = mount(ToolResultDrawer, {
      global: {
        stubs: commonStubs,
      },
    })

    const handle = wrapper.find('button.handle')

    await handle.trigger('click')

    const overlay = wrapper.find('.overlay')

    expect(overlay.exists()).toBe(true)

    await overlay.trigger('click')

    expect(wrapper.find('.overlay').exists()).toBe(false)
    expect(wrapper.find('section.result-drawer').classes()).not.toContain('is-open')
  })
})
