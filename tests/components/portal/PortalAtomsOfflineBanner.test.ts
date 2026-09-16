import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import PortalAtomsOfflineBanner from '../../../app/components/portal/AtomsOfflineBanner.vue'

// @vueuse/core の useOnline をモック
const isOnlineRef = ref(true)

vi.mock('@vueuse/core', () => ({
  useOnline: () => isOnlineRef,
}))

describe('PortalAtomsOfflineBanner', () => {
  it('オンライン時はバナーが表示されないこと', () => {
    isOnlineRef.value = true
    const wrapper = mount(PortalAtomsOfflineBanner, {
      global: {
        stubs: {
          Icon: true,
        },
      },
    })

    expect(wrapper.find('.offline-banner').exists()).toBe(false)
  })

  it('オフライン時はオフライン警告バナーが表示されること', async () => {
    isOnlineRef.value = false
    const wrapper = mount(PortalAtomsOfflineBanner, {
      global: {
        stubs: {
          Icon: true,
        },
      },
    })

    expect(wrapper.find('.offline-banner.offline').exists()).toBe(true)
    expect(wrapper.text()).toContain('圏外（オフライン）')
  })
})
