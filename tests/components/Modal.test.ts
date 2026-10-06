import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Modal from '../../app/components/common/organisms/Modal.vue'

describe('Modal.vue', () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.open = true
    })
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.open = false
    })
  })

  const commonStubs = {
    Panel: {
      template: '<div class="panel-stub"><slot /></div>',
    },
    Heading: {
      props: ['level'],
      template: '<h3><slot /></h3>',
    },
    Divider: {
      template: '<hr />',
    },
    Button: {
      props: ['variant', 'disabled', 'loading'],
      template: '<button :disabled="disabled || loading"><slot /></button>',
    },
  }

  it('renders default slot content, title and default close button', () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: 'ダイアログタイトル',
      },
      slots: {
        default: '<div class="test-content">Modal Body Content</div>',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('ダイアログタイトル')
    expect(wrapper.text()).toContain('Modal Body Content')
    expect(wrapper.text()).toContain('閉じる')
  })

  it('renders custom actions slot when provided', () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: 'タイトル',
      },
      slots: {
        default: 'Body',
        actions: '<button class="custom-action">保存する</button>',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('保存する')
  })

  it('does not close on backdrop click', async () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
      },
      global: {
        stubs: commonStubs,
      },
    })

    const dialog = wrapper.find('dialog')

    await dialog.trigger('click')

    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('handles cancel event on native dialog cancel (Esc key)', async () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
      },
      global: {
        stubs: commonStubs,
      },
    })

    const dialog = wrapper.find('dialog')

    await dialog.trigger('cancel')

    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('calls showModal and close on v-model changes', async () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: false,
      },
      slots: {
        default: 'Body',
      },
      global: {
        stubs: commonStubs,
      },
    })

    await wrapper.setProps({ modelValue: true })
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled()

    await wrapper.setProps({ modelValue: false })
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled()
  })

  it('applies size class correctly', () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
        size: 'lg',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('dialog').classes()).toContain('is-lg')
  })

  it('renders custom footer slot when provided', () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: 'タイトル',
      },
      slots: {
        default: 'Body',
        footer: '<div class="custom-footer">フッターアクション</div>',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('.modal-footer').exists()).toBe(true)
    expect(wrapper.find('.custom-footer').text()).toBe('フッターアクション')
  })

  it('does not have pure accessibility attributes (aria-*, role)', () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: 'アクセシビリティ検証',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.find('dialog').attributes('role')).toBeUndefined()
  })
})
