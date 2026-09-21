import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UserListItem from '../../../app/components/portal/molecules/UserListItem.vue'
import type { User } from '../../../app/types/auth'

describe('UserListItem.vue', () => {
  const dummyUser: User = {
    id: 'user-01',
    loginId: 'yamada01',
    firstName: '太郎',
    lastName: '山田',
    firstNameKana: 'たろう',
    lastNameKana: 'やまだ',
    role: 'worker',
    assignedSiteIds: [],
    requirePasswordReset: false,
    lastLoginAt: null,
    createdAt: '2026-09-01T00:00:00Z',
    isActive: true,
  }

  it('renders user name, loginId, and role badge', () => {
    const wrapper = mount(UserListItem, {
      props: {
        user: dummyUser,
        isSelected: false,
      },
    })

    expect(wrapper.text()).toContain('山田 太郎')
    expect(wrapper.text()).toContain('yamada01')
    expect(wrapper.text()).toContain('作業者')
    expect(wrapper.classes()).not.toContain('is-selected')
  })

  it('applies is-selected class when isSelected is true', () => {
    const wrapper = mount(UserListItem, {
      props: {
        user: dummyUser,
        isSelected: true,
      },
    })

    expect(wrapper.classes()).toContain('is-selected')
  })

  it('renders password reset required badge when requirePasswordReset is true', () => {
    const wrapper = mount(UserListItem, {
      props: {
        user: { ...dummyUser, requirePasswordReset: true },
      },
    })

    expect(wrapper.text()).toContain('PWリセット要求')
  })

  it('emits select event when item is clicked', async () => {
    const wrapper = mount(UserListItem, {
      props: {
        user: dummyUser,
      },
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')?.[0]).toEqual([dummyUser])
  })
})
