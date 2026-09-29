import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ToolResultPanel from '../../../app/components/tool/ResultPanel.vue'

describe('ToolResultPanel.vue', () => {
  const commonStubs = {
    Panel: {
      template: '<div class="panel-stub"><slot /></div>',
    },
    SectionHeader: {
      props: ['title', 'icon', 'variant', 'size'],
      template: `
        <div class="header-stub">
          <span>{{ title }}</span>
          <slot name="actions" />
        </div>
      `,
    },
    Button: {
      props: ['variant', 'disabled', 'loading'],
      template: '<button class="button-stub"><slot /></button>',
    },
    Icon: {
      props: ['name', 'size'],
      template: '<i class="icon-stub" />',
    },
  }

  it('renders slot content and title correctly', () => {
    const wrapper = mount(ToolResultPanel, {
      props: {
        title: '計算結果・選定結果',
      },
      slots: {
        default: '<div class="test-content">計算結果の内容</div>',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('計算結果・選定結果')
    expect(wrapper.text()).toContain('計算結果の内容')
  })

  it('does not render basis button when basis slot is not provided', () => {
    const wrapper = mount(ToolResultPanel, {
      global: {
        stubs: commonStubs,
      },
    })

    const buttons = wrapper.findAll('button')
    const basisButton = buttons.find(b => b.text().includes('計算根拠'))

    expect(basisButton).toBeUndefined()
  })

  it('executes saveFunction when save button is clicked', async () => {
    const saveMock = vi.fn().mockResolvedValue(undefined)

    const wrapper = mount(ToolResultPanel, {
      props: {
        saveFunction: saveMock,
      },
      global: {
        stubs: commonStubs,
      },
    })

    const buttons = wrapper.findAll('button')
    const saveButton = buttons.find(b => b.text().includes('履歴に保存'))

    expect(saveButton).toBeDefined()
    await saveButton?.trigger('click')

    expect(saveMock).toHaveBeenCalledTimes(1)
  })

  it('toggles basis view when basis button is clicked and returns on next click', async () => {
    const wrapper = mount(ToolResultPanel, {
      slots: {
        default: '<div class="results-content">計算結果</div>',
        basis: '<div class="basis-content">計算根拠ステップ</div>',
      },
      global: {
        stubs: commonStubs,
      },
    })

    // 初期状態: 結果が表示されている
    expect(wrapper.find('.header-stub').text()).toContain('計算結果・選定結果')
    expect(wrapper.find('.results-content').exists()).toBe(true)
    expect(wrapper.find('.basis-content').exists()).toBe(false)

    // 「計算根拠」ボタンをクリック
    const buttons = wrapper.findAll('button')
    const basisButton = buttons.find(b => b.text().includes('計算根拠'))

    expect(basisButton).toBeDefined()
    await basisButton?.trigger('click')

    // 根拠表示時: タイトルとコンテンツが切り替わる
    expect(wrapper.find('.header-stub').text()).toContain('計算根拠')
    expect(wrapper.find('.basis-content').exists()).toBe(true)
    expect(wrapper.find('.results-content').exists()).toBe(false)

    // ボタンのテキストが「結果に戻る」になっている
    const updatedButtons = wrapper.findAll('button')
    const backButton = updatedButtons.find(b => b.text().includes('結果に戻る'))

    expect(backButton).toBeDefined()

    // 「結果に戻る」ボタンをクリック
    await backButton?.trigger('click')

    // 復帰確認
    expect(wrapper.find('.header-stub').text()).toContain('計算結果・選定結果')
    expect(wrapper.find('.results-content').exists()).toBe(true)
    expect(wrapper.find('.basis-content').exists()).toBe(false)
  })
})
