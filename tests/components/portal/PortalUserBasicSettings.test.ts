import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PortalUserBasicSettings from '../../../app/components/portal/molecules/UserBasicSettings.vue'
import type { User } from '../../../app/types/auth'

describe('PortalUserBasicSettings.vue', () => {
  const dummyUser: User = {
    id: 'user-01',
    loginId: 'yamada01',
    lastName: '山田',
    firstName: '太郎',
    lastNameKana: 'やまだ',
    firstNameKana: 'たろう',
    role: 'worker',
    assignedSiteIds: [],
    requirePasswordReset: false,
    lastLoginAt: '2026-09-20T10:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    isActive: true,
  }

  const baseProps = {
    user: dummyUser,
    lastName: '山田',
    firstName: '太郎',
    lastNameKana: 'やまだ',
    firstNameKana: 'たろう',
    userRole: 'worker' as const,
    requirePasswordReset: false,
  }

  it('renders all form fields with initial values correctly', () => {
    const wrapper = mount(PortalUserBasicSettings, {
      props: baseProps,
    })

    expect(wrapper.text()).toContain('ユーザー基本情報')
    expect(wrapper.text()).toContain('姓')
    expect(wrapper.text()).toContain('名')
    expect(wrapper.text()).toContain('姓（ふりがな）')
    expect(wrapper.text()).toContain('名（ふりがな）')
    expect(wrapper.text()).toContain('ログインID')
    expect(wrapper.text()).toContain('権限')
    expect(wrapper.text()).toContain('次回ログイン時にパスワード変更を要求する')
    expect(wrapper.text()).toContain('最終ログイン日時')
  })

  it('renders "未ログイン" when lastLoginAt is null', () => {
    const wrapper = mount(PortalUserBasicSettings, {
      props: {
        ...baseProps,
        user: { ...dummyUser, lastLoginAt: null },
      },
    })

    expect(wrapper.text()).toContain('未ログイン')
  })

  it('disables role select when user id is master', () => {
    const wrapper = mount(PortalUserBasicSettings, {
      props: {
        ...baseProps,
        user: { ...dummyUser, id: 'master' },
      },
    })

    const select = wrapper.findComponent({ name: 'Select' })

    expect(select.props('disabled')).toBe(true)
  })

  it('falls back to user.id when loginId is empty', () => {
    const wrapper = mount(PortalUserBasicSettings, {
      props: {
        ...baseProps,
        user: { ...dummyUser, loginId: '', id: 'fallback-id' },
      },
    })

    const inputs = wrapper.findAllComponents({ name: 'Input' })
    const loginIdInput = inputs.find(i => i.props('disabled'))

    expect(loginIdInput?.props('modelValue')).toBe('fallback-id')
  })

  it('emits update:lastName when lastName input changes', async () => {
    const wrapper = mount(PortalUserBasicSettings, {
      props: baseProps,
    })

    const inputs = wrapper.findAllComponents({ name: 'Input' })

    // 0: 姓, 1: 名, 2: 姓かな, 3: 名かな, 4: ログインID
    await inputs[0].vm.$emit('update:modelValue', '佐藤')

    expect(wrapper.emitted('update:lastName')).toBeTruthy()
    expect(wrapper.emitted('update:lastName')![0]).toEqual(['佐藤'])
  })
})
