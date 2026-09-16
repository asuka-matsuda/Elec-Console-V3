import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import OrganismsHeader from '../../app/components/OrganismsHeader.vue'

const mockCurrentUser = ref<{ firstName: string, lastName: string } | null>(null)
const mockLogout = vi.fn()

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser,
    logout: mockLogout,
  }),
}))

describe('OrganismsHeader.vue', () => {
  it('renders guest when currentUser is null', () => {
    mockCurrentUser.value = null
    const wrapper = mount(OrganismsHeader, {
      global: {
        stubs: {
          NuxtLink: true,
          AtomsLogo: true,
          Breadcrumb: true,
          Button: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          Icon: true,
        },
      },
    })

    expect(wrapper.text()).toContain('ゲスト')
  })

  it('renders user name when currentUser exists', () => {
    mockCurrentUser.value = { lastName: '山田', firstName: '太郎' }
    const wrapper = mount(OrganismsHeader, {
      global: {
        stubs: {
          NuxtLink: true,
          AtomsLogo: true,
          Breadcrumb: true,
          Button: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          Icon: true,
        },
      },
    })

    expect(wrapper.text()).toContain('山田 太郎')
  })

  it('triggers logout on logout button click', async () => {
    mockCurrentUser.value = { lastName: '山田', firstName: '太郎' }
    const wrapper = mount(OrganismsHeader, {
      global: {
        stubs: {
          NuxtLink: true,
          AtomsLogo: true,
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
})
