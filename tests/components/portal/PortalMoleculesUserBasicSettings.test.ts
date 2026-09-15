import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MoleculesUserBasicSettings from '../../../app/components/portal/MoleculesUserBasicSettings.vue'
import type { User } from '../../../app/types/auth'

describe('MoleculesUserBasicSettings.vue', () => {
  const dummyUser: User = {
    id: 'user-01',
    loginId: 'yamada01',
    lastName: '山田',
    firstName: '太郎',
    role: 'worker',
    lastLoginAt: '2026-09-10T10:00:00Z',
  }

  it('renders user basic form fields', () => {
    const wrapper = mount(MoleculesUserBasicSettings, {
      props: {
        user: dummyUser,
        lastName: '山田',
        firstName: '太郎',
        lastNameKana: 'やまだ',
        firstNameKana: 'たろう',
        userRole: 'worker',
        requirePasswordReset: false,
      },
    })

    expect(wrapper.text()).toContain('ユーザー基本情報')
    expect(wrapper.text()).toContain('ログインID')
    expect(wrapper.text()).toContain('権限')
    expect(wrapper.text()).toContain('次回ログイン時にパスワード変更を要求する')
  })
})
