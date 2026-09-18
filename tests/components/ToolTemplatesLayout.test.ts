import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ToolTemplatesLayout from '../../app/components/tool/TemplatesLayout.vue'

describe('ToolTemplatesLayout.vue', () => {
  const commonStubs = {
    Disclaimer: {
      template: '<div class="disclaimer-stub">免責事項</div>',
    },
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

  it('renders inputs and results slot contents', () => {
    const wrapper = mount(ToolTemplatesLayout, {
      slots: {
        inputs: '<div class="test-inputs">入力エリア</div>',
        results: '<div class="test-results">結果エリア</div>',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('入力エリア')
    expect(wrapper.text()).toContain('結果エリア')
    expect(wrapper.text()).toContain('条件入力')
    expect(wrapper.text()).toContain('計算結果・選定結果')
  })

  it('emits reset event when reset button is clicked', async () => {
    const wrapper = mount(ToolTemplatesLayout, {
      global: {
        stubs: commonStubs,
      },
    })

    const buttons = wrapper.findAll('button')
    const resetButton = buttons.find(b => b.text().includes('リセット'))

    expect(resetButton).toBeDefined()
    await resetButton?.trigger('click')

    expect(wrapper.emitted('reset')).toHaveLength(1)
  })

  it('renders basis button when basis slot is provided', async () => {
    const wrapper = mount(ToolTemplatesLayout, {
      slots: {
        basis: '<div class="test-basis">計算根拠モーダル</div>',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('計算根拠')
  })

  it('executes saveFunction when save button is clicked', async () => {
    const saveMock = vi.fn().mockResolvedValue(undefined)

    const wrapper = mount(ToolTemplatesLayout, {
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

  it('toggles mobile drawer when drawer handle button is clicked', async () => {
    const wrapper = mount(ToolTemplatesLayout, {
      global: {
        stubs: commonStubs,
      },
    })

    const drawerHandle = wrapper.find('button.handle')
    const drawer = wrapper.find('section.result-drawer')

    expect(drawerHandle.exists()).toBe(true)
    expect(drawer.classes()).not.toContain('is-open')

    await drawerHandle.trigger('click')
    expect(drawer.classes()).toContain('is-open')

    await drawerHandle.trigger('click')
    expect(drawer.classes()).not.toContain('is-open')
  })

  it('passes disclaimerText prop to Disclaimer', () => {
    const wrapper = mount(ToolTemplatesLayout, {
      props: {
        disclaimerText: 'カスタム免責テキスト',
      },
      global: {
        stubs: {
          ...commonStubs,
          Disclaimer: {
            props: ['text'],
            template: '<div class="disclaimer-stub" :data-text="text">免責事項</div>',
          },
        },
      },
    })

    const disclaimer = wrapper.find('.disclaimer-stub')

    expect(disclaimer.exists()).toBe(true)
    expect(disclaimer.attributes('data-text')).toBe('カスタム免責テキスト')
  })

  it('hides disclaimer when hideDisclaimer prop is true', () => {
    const wrapper = mount(ToolTemplatesLayout, {
      props: {
        hideDisclaimer: true,
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('.disclaimer-stub').exists()).toBe(false)
  })

  it('renders default Disclaimer when no props or slots are given', () => {
    const wrapper = mount(ToolTemplatesLayout, {
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('.disclaimer-stub').exists()).toBe(true)
  })

  it('renders custom disclaimer slot content when provided', () => {
    const wrapper = mount(ToolTemplatesLayout, {
      slots: {
        disclaimer: '<div class="custom-slot-disclaimer">カスタム免責スロット</div>',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('.custom-slot-disclaimer').exists()).toBe(true)
    expect(wrapper.find('.disclaimer-stub').exists()).toBe(false)
  })
})
