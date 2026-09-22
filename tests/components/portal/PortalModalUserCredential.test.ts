import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ModalUserCredential from '../../../app/components/portal/admin/ModalUserCredential.vue'

describe('ModalUserCredential.vue', () => {
  const dummyUser = {
    id: 'user-01',
    loginId: 'yamada',
    firstName: '太郎',
    lastName: '山田',
    role: 'admin' as const,
    initialPassword: 'temp-password-123',
  }

  it('renders credential info when user is provided', () => {
    const wrapper = mount(ModalUserCredential, {
      props: {
        modelValue: true,
        user: dummyUser,
      },
    })

    expect(wrapper.text()).toContain('山田 太郎')
    expect(wrapper.text()).toContain('yamada')
    expect(wrapper.text()).toContain('temp-password-123')
  })

  it('emits update:modelValue with false when complete button is clicked', async () => {
    const wrapper = mount(ModalUserCredential, {
      props: {
        modelValue: true,
        user: dummyUser,
      },
    })

    const buttons = wrapper.findAllComponents({ name: 'Button' })
    const completeBtn = buttons.find(b => b.text().includes('完了'))

    expect(completeBtn).toBeDefined()

    await completeBtn?.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('copies password to clipboard when copy button is clicked', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    })

    const wrapper = mount(ModalUserCredential, {
      props: {
        modelValue: true,
        user: dummyUser,
      },
    })

    const copyBtn = wrapper.findAllComponents({ name: 'Button' }).find(b => b.text().includes('コピー'))

    expect(copyBtn).toBeDefined()

    await copyBtn?.trigger('click')

    expect(writeTextMock).toHaveBeenCalledWith('temp-password-123')
  })
})
