import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import OrganismsModal from '../../app/components/common/organisms/Modal.vue'

describe('OrganismsModal.vue', () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.open = true
    })
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.open = false
    })
  })

  const commonStubs = {
    AtomsPanel: {
      template: '<div class="panel-stub"><slot /></div>',
    },
    MoleculesSectionHeader: {
      props: ['title', 'icon', 'variant'],
      template: '<div class="section-header-stub">{{ title }}</div>',
    },
    AtomsButton: {
      props: ['variant', 'disabled'],
      template: '<button :disabled="disabled"><slot /></button>',
    },
  }

  it('renders default slot content', () => {
    const wrapper = mount(OrganismsModal, {
      props: {
        modelValue: true,
      },
      slots: {
        default: '<div class="test-content">Modal Body Content</div>',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('Modal Body Content')
  })

  it('renders section header when title is provided', () => {
    const wrapper = mount(OrganismsModal, {
      props: {
        modelValue: true,
        title: 'テストモーダル',
      },
      slots: {
        default: 'Content',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('テストモーダル')
  })

  it('renders submit and cancel buttons when submitFn is provided, and handles submission', async () => {
    const submitMock = vi.fn().mockResolvedValue(undefined)

    const wrapper = mount(OrganismsModal, {
      props: {
        'modelValue': true,
        'submitFn': submitMock,
        'submitText': '確定する',
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
    expect(buttons.length).toBe(2)
    expect(buttons[0].text()).toBe('閉じる')
    expect(buttons[1].text()).toBe('確定する')

    await buttons[1].trigger('click')
    expect(submitMock).toHaveBeenCalledTimes(1)
  })

  it('displays error message when submitFn rejects', async () => {
    const submitMock = vi.fn().mockRejectedValue(new Error('送信エラーが発生しました'))

    const wrapper = mount(OrganismsModal, {
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
    await buttons[1].trigger('click')

    expect(wrapper.text()).toContain('送信エラーが発生しました')
  })

  it('renders custom footer slot when provided', () => {
    const wrapper = mount(OrganismsModal, {
      props: {
        modelValue: true,
      },
      slots: {
        default: 'Body',
        footer: '<div class="custom-footer">Custom Footer</div>',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('Custom Footer')
  })
})
