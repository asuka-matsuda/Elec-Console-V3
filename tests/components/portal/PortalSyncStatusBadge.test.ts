import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import PortalSyncStatusBadge from '../../../app/components/portal/molecules/SyncStatusBadge.vue'

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
          PortalOrganismsSyncQueueModal: true,
        },
      },
    })

    expect(wrapper.text()).toContain('同期済')
    expect(wrapper.find('.sync-dot').exists()).toBe(true)
    expect(wrapper.find('button.sync-btn').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'PortalOrganismsSyncQueueModal' }).exists()).toBe(false)
  })

  it('renders sync button when there are pending items and lazily mounts modal on click', async () => {
    mockPendingCount.value = 3
    mockHasPending.value = true

    const wrapper = mount(PortalSyncStatusBadge, {
      props: { siteId: 'site-001' },
      global: {
        stubs: {
          Icon: true,
          PortalOrganismsSyncQueueModal: {
            name: 'PortalOrganismsSyncQueueModal',
            template: '<div class="sync-modal-stub" />',
            emits: ['synced', 'update:modelValue'],
          },
        },
      },
    })

    expect(wrapper.text()).toContain('未同期 3件')
    expect(wrapper.text()).toContain('同期実行')
    expect(wrapper.find('button.sync-btn').attributes('disabled')).toBeUndefined()
    // 平時はモーダルがマウントされていない（引き算・遅延マウントの検証）
    expect(wrapper.find('.sync-modal-stub').exists()).toBe(false)

    // クリックでモーダルがマウントされる
    await wrapper.find('button.sync-btn').trigger('click')
    expect(wrapper.find('.sync-modal-stub').exists()).toBe(true)

    // モーダルからの synced イベントをリレーする
    const modalComponent = wrapper.findComponent({ name: 'PortalOrganismsSyncQueueModal' })

    modalComponent.vm.$emit('synced')
    expect(wrapper.emitted('synced')).toHaveLength(1)
  })

  it('disables button and applies spinning icon when syncing', () => {
    mockPendingCount.value = 2
    mockHasPending.value = true
    mockIsSyncing.value = true

    const wrapper = mount(PortalSyncStatusBadge, {
      props: { siteId: 'site-001' },
      global: {
        stubs: {
          Icon: {
            name: 'Icon',
            template: '<i :class="$attrs.class" :data-name="name" />',
            props: ['name'],
          },
          PortalOrganismsSyncQueueModal: true,
        },
      },
    })

    const button = wrapper.find('button.sync-btn')

    expect(button.attributes('disabled')).toBeDefined()

    const icon = wrapper.find('i')

    expect(icon.attributes('data-name')).toBe('refresh-cw')
    expect(icon.classes()).toContain('animate-spin')
  })
})
