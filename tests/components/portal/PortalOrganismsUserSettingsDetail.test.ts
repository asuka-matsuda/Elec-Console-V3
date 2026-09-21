import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UserSettingsDetail from '../../../app/components/portal/organisms/UserSettingsDetail.vue'
import type { Site } from '../../../app/types/admin'
import type { User } from '../../../app/types/auth'

describe('UserSettingsDetail.vue', () => {
  const dummyUser: User = {
    id: 'user-01',
    loginId: 'yamada01',
    lastName: '山田',
    firstName: '太郎',
    role: 'worker',
  }

  const dummySites: Site[] = [
    { id: 'site-a', name: '新宿現場', status: 'in_progress' },
  ]

  it('renders empty state when user is null', () => {
    const wrapper = mount(UserSettingsDetail, {
      props: {
        user: null,
        siteList: dummySites,
      },
    })

    expect(wrapper.text()).toContain('ユーザーが選択されていません')
  })

  it('renders user details when user is provided', () => {
    const wrapper = mount(UserSettingsDetail, {
      props: {
        user: dummyUser,
        siteList: dummySites,
      },
    })

    expect(wrapper.text()).toContain('山田 太郎')
    expect(wrapper.text()).toContain('ID: yamada01')
    expect(wrapper.text()).toContain('基本情報')
    expect(wrapper.text()).toContain('現場アサイン')
  })

  it('emits save event with form updates', async () => {
    const wrapper = mount(UserSettingsDetail, {
      props: {
        user: dummyUser,
        siteList: dummySites,
      },
    })

    const saveBtn = wrapper.findAllComponents({ name: 'Button' }).find(b => b.text().includes('変更を保存'))

    expect(saveBtn).toBeDefined()

    await saveBtn!.trigger('click')

    expect(wrapper.emitted('save')).toBeTruthy()

    const emittedData = wrapper.emitted('save')![0][0] as Partial<User>

    expect(emittedData.lastName).toBe('山田')
    expect(emittedData.firstName).toBe('太郎')
  })
})
