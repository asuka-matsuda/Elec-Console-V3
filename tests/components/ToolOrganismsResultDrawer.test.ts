import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ToolOrganismsResultDrawer from '../../app/components/tool/OrganismsResultDrawer.vue'

describe('ToolOrganismsResultDrawer.vue', () => {
  const commonStubs = {
    AtomsPanel: {
      template: '<div class="panel-stub"><slot /></div>',
    },
    MoleculesSectionHeader: {
      props: ['title', 'icon', 'variant', 'size'],
      template: `
        <div class="header-stub">
          <span>{{ title }}</span>
          <slot name="actions" />
        </div>
      `,
    },
    AtomsButton: {
      props: ['variant', 'size', 'disabled', 'loading'],
      template: '<button class="button-stub"><slot /></button>',
    },
    AtomsIcon: {
      props: ['name', 'size'],
      template: '<i class="icon-stub" />',
    },
  }

  it('renders slot content and title correctly', () => {
    const wrapper = mount(ToolOrganismsResultDrawer, {
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

    expect(wrapper.text()).toContain('計算結果を見る')
    expect(wrapper.text()).toContain('計算結果・選定結果')
    expect(wrapper.text()).toContain('計算結果の内容')
  })

  it('toggles drawer state when handle button is clicked', async () => {
    const wrapper = mount(ToolOrganismsResultDrawer, {
      global: {
        stubs: commonStubs,
      },
    })

    const handle = wrapper.find('button.handle')
    const section = wrapper.find('section.result-drawer')

    expect(handle.attributes('aria-expanded')).toBe('false')
    expect(section.classes()).not.toContain('is-open')
    expect(wrapper.find('.overlay').exists()).toBe(false)

    // 1回目クリック: 開く
    await handle.trigger('click')

    expect(handle.attributes('aria-expanded')).toBe('true')
    expect(section.classes()).toContain('is-open')
    expect(wrapper.find('.overlay').exists()).toBe(true)

    // 2回目クリック: 閉じる
    await handle.trigger('click')

    expect(handle.attributes('aria-expanded')).toBe('false')
    expect(section.classes()).not.toContain('is-open')
    expect(wrapper.find('.overlay').exists()).toBe(false)
  })

  it('emits openBasis event when basis button is clicked', async () => {
    const wrapper = mount(ToolOrganismsResultDrawer, {
      props: {
        hasBasis: true,
      },
      global: {
        stubs: commonStubs,
      },
    })

    const buttons = wrapper.findAll('button')
    const basisButton = buttons.find(b => b.text().includes('計算根拠'))

    expect(basisButton).toBeDefined()
    await basisButton?.trigger('click')

    expect(wrapper.emitted('openBasis')).toHaveLength(1)
  })

  it('executes saveFunction when save button is clicked', async () => {
    const saveMock = vi.fn().mockResolvedValue(undefined)

    const wrapper = mount(ToolOrganismsResultDrawer, {
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

  it('closes drawer when overlay is clicked', async () => {
    const wrapper = mount(ToolOrganismsResultDrawer, {
      global: {
        stubs: commonStubs,
      },
    })

    const handle = wrapper.find('button.handle')

    await handle.trigger('click')

    const overlay = wrapper.find('.overlay')

    expect(overlay.exists()).toBe(true)

    await overlay.trigger('click')

    expect(handle.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.overlay').exists()).toBe(false)
  })
})
