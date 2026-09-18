import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import OrganismsDrawer from '../../app/components/OrganismsDrawer.vue'

describe('OrganismsDrawer.vue', () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.open = true
    })
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.open = false
    })
  })

  const commonStubs = {
    SectionHeader: {
      props: ['title', 'icon', 'variant'],
      template: '<div class="section-header-stub">{{ title }}</div>',
    },
    Button: {
      props: ['variant', 'disabled', 'loading'],
      template: '<button :disabled="disabled || loading"><slot /></button>',
    },
    Icon: {
      props: ['name'],
      template: '<i :class="name" />',
    },
  }

  it('renders default slot content', () => {
    const wrapper = mount(OrganismsDrawer, {
      props: {
        modelValue: true,
      },
      slots: {
        default: '<div class="test-drawer-content">Drawer Body Content</div>',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('Drawer Body Content')
  })

  it('renders section header when title is provided', () => {
    const wrapper = mount(OrganismsDrawer, {
      props: {
        modelValue: true,
        title: 'テストドロワー',
      },
      slots: {
        default: 'Content',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('テストドロワー')
  })

  it('renders submit and cancel buttons when submitFn is provided, and handles submission', async () => {
    const submitMock = vi.fn().mockResolvedValue(undefined)

    const wrapper = mount(OrganismsDrawer, {
      props: {
        'modelValue': true,
        'submitFn': submitMock,
        'submitText': '保存する',
        'cancelText': '閉じる',
        'onUpdate:modelValue': (val: boolean) => wrapper.setProps({ modelValue: val }),
      },
      slots: {
        default: 'Content',
      },
      global: {
        stubs: commonStubs,
      },
    })

    const buttons = wrapper.findAll('button')
    // 最初のbuttonはクローズボタン、次がキャンセル、最後がsubmit
    const submitButton = buttons.find(b => b.text().includes('保存する'))

    expect(submitButton).toBeDefined()
    await submitButton?.trigger('click')
    expect(submitMock).toHaveBeenCalledTimes(1)
  })

  it('displays error message when submitFn rejects', async () => {
    const submitMock = vi.fn().mockRejectedValue(new Error('保存エラーが発生しました'))

    const wrapper = mount(OrganismsDrawer, {
      props: {
        modelValue: true,
        submitFn: submitMock,
      },
      slots: {
        default: 'Content',
      },
      global: {
        stubs: commonStubs,
      },
    })

    const buttons = wrapper.findAll('button')
    const submitButton = buttons.find(b => b.text().includes('保存する'))

    await submitButton?.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('保存エラーが発生しました')
  })

  it('emits update:modelValue with false when close button is clicked', async () => {
    const wrapper = mount(OrganismsDrawer, {
      props: {
        modelValue: true,
      },
      slots: {
        default: 'Content',
      },
      global: {
        stubs: commonStubs,
      },
    })

    const closeButton = wrapper.find('header button')

    await closeButton.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })
})
