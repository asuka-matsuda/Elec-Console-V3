import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import PortalSyncStatusBadge from '../../../app/components/portal/souden/SyncStatusBadge.vue'

const mockPendingCount = ref(0)
const mockHasPending = ref(false)
const mockIsSyncing = ref(false)

vi.mock('~/composables/portal/useOfflineSync', () => ({
  useOfflineSync: () => ({
    pendingCount: mockPendingCount,
    hasPending: mockHasPending,
    isSyncing: mockIsSyncing,
  }),
}))

describe('PortalSyncStatusBadge.vue', () => {
  beforeEach(() => {
    mockPendingCount.value = 0
    mockHasPending.value = false
    mockIsSyncing.value = false
  })

  it('renders synced status when there are no pending items', () => {
    const wrapper = mount(PortalSyncStatusBadge, {
      props: { siteId: 'site-001' },
      global: {
        stubs: {
          Icon: true,
          PortalModalSyncQueue: true,
        },
      },
    })

    expect(wrapper.text()).toContain('同期済')
    expect(wrapper.findComponent({ name: 'Badge' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'Button' }).exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'PortalModalSyncQueue' }).exists()).toBe(false)
  })

  it('renders sync button when there are pending items and lazily mounts modal on click', async () => {
    mockPendingCount.value = 3
    mockHasPending.value = true

    const wrapper = mount(PortalSyncStatusBadge, {
      props: { siteId: 'site-001' },
      global: {
        stubs: {
          Icon: true,
          PortalModalSyncQueue: {
            name: 'PortalModalSyncQueue',
            template: '<div class="sync-modal-stub" />',
            emits: ['synced', 'update:modelValue'],
          },
        },
      },
    })

    expect(wrapper.text()).toContain('未同期 3件')
    expect(wrapper.text()).toContain('同期実行')
    const button = wrapper.findComponent({ name: 'Button' })

    expect(button.exists()).toBe(true)
    expect(button.props('disabled')).toBe(false)
    // 平時はモーダルがマウントされていない（引き算・遅延マウントの検証）
    expect(wrapper.find('.sync-modal-stub').exists()).toBe(false)

    // クリックでモーダルがマウントされる
    await button.trigger('click')
    expect(wrapper.find('.sync-modal-stub').exists()).toBe(true)
  })

  it('disables button and applies spinning icon when syncing', () => {
    mockPendingCount.value = 2
    mockHasPending.value = true
    mockIsSyncing.value = true

    const wrapper = mount(PortalSyncStatusBadge, {
      props: { siteId: 'site-001' },
      global: {
        stubs: {
          PortalModalSyncQueue: true,
        },
      },
    })

    const button = wrapper.findComponent({ name: 'Button' })

    expect(button.exists()).toBe(true)
    expect(button.props('loading')).toBe(true)
    expect(button.props('icon')).toBe('refresh-cw')
  })
})
