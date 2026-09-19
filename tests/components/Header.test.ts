import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import Header from '../../app/components/common/organisms/Header.vue'

const mockCurrentUser = ref<{ firstName: string, lastName: string } | null>(null)
const mockLogout = vi.fn()

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser,
    logout: mockLogout,
  }),
}))

describe('Header.vue', () => {
  it('renders user name and link to /mypage when currentUser exists', () => {
    mockCurrentUser.value = { lastName: '山田', firstName: '太郎' }
    const wrapper = mount(Header, {
      global: {
        stubs: {
          NuxtLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
          Logo: true,
          Breadcrumb: true,
          Button: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          Icon: true,
        },
      },
    })

    expect(wrapper.text()).toContain('山田 太郎')
    const mypageLink = wrapper.find('a[href="/mypage"]')

    expect(mypageLink.exists()).toBe(true)
  })

  it('triggers logout on logout button click', async () => {
    mockCurrentUser.value = { lastName: '山田', firstName: '太郎' }
    const wrapper = mount(Header, {
      global: {
        stubs: {
          NuxtLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
          Logo: true,
          Breadcrumb: true,
          Button: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          Icon: true,
        },
      },
    })

    const buttons = wrapper.findAll('button')
    const logoutBtn = buttons.find(b => b.text().includes('ログアウト')) || buttons[buttons.length - 1]

    await logoutBtn.trigger('click')
    expect(mockLogout).toHaveBeenCalled()
  })

  it('emits toggle-sidebar on menu button click', async () => {
    const wrapper = mount(Header, {
      global: {
        stubs: {
          NuxtLink: true,
          Logo: true,
          Breadcrumb: true,
          Button: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          Icon: true,
        },
      },
    })

    const menuBtn = wrapper.find('button')

    await menuBtn.trigger('click')
    expect(wrapper.emitted('toggle-sidebar')).toBeTruthy()
  })
})
