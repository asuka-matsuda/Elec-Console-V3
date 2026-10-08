import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import ModalSyncQueue from '../../../../app/components/portal/souden/ModalSyncQueue.vue'
import type { PendingSyncItem } from '../../../../app/composables/portal/useOfflineSync'

const dummyQueue = ref<PendingSyncItem[]>([])
const resolveConflictMock = vi.fn()
const resolveAllConflictsMock = vi.fn()
const syncAllMock = vi.fn()

vi.mock('~/composables/portal/useOfflineSync', () => ({
  useOfflineSync: () => ({
    queue: dummyQueue,
    pendingCount: ref(0),
    isSyncing: ref(false),
    syncAll: syncAllMock,
    resolveConflict: resolveConflictMock,
    resolveAllConflicts: resolveAllConflictsMock,
  }),
}))

describe('ModalSyncQueue.vue', () => {
  it('renders empty state when queue is empty', () => {
    dummyQueue.value = []

    const wrapper = mount(ModalSyncQueue, {
      props: {
        modelValue: true,
        siteId: 'site-01',
      },
    })

    expect(wrapper.text()).toContain('未送信データはありません')
  })

  it('renders conflict items with diff table and resolves single conflict', async () => {
    dummyQueue.value = [
      {
        id: 'sync-01',
        siteId: 'site-01',
        circuitId: 'c-01',
        banMeisho: '1L-1',
        kairoBangou: '1',
        kairoMeisho: '電灯回路',
        phase: 1,
        status: 'conflict',
        clientConfirmedAt: '2026-10-08T10:00:00Z',
        serverCircuitData: {
          updatedAt: '2026-10-08T09:55:00Z',
          p1Kakunin: 1,
          p1Mashishime: 0,
        },
        payload: {
          kakunin: true,
          mashishime: true,
        },
      },
    ]

    const wrapper = mount(ModalSyncQueue, {
      props: {
        modelValue: true,
        siteId: 'site-01',
      },
    })

    expect(wrapper.text()).toContain('更新競合が発生しました')
    expect(wrapper.text()).toContain('1L-1')
    expect(wrapper.text()).toContain('点検・測定項目')
    expect(wrapper.text()).toContain('確認')
    expect(wrapper.text()).toContain('増締')
    expect(wrapper.text()).toContain('差異')

    // 1件のみのため一括操作バーは非表示
    expect(wrapper.text()).not.toContain('一括解決')

    // ボタンクリックテスト
    const buttons = wrapper.findAllComponents({ name: 'Button' })
    const overwriteBtn = buttons.find(b => b.text().includes('自分の値で上書きする'))

    expect(overwriteBtn).toBeDefined()
    await overwriteBtn?.trigger('click')

    expect(resolveConflictMock).toHaveBeenCalledWith('sync-01', 'overwrite')
    expect(wrapper.emitted('synced')).toBeDefined()
  })

  it('renders bulk resolution bar when multiple conflicts exist', async () => {
    dummyQueue.value = [
      {
        id: 'sync-01',
        siteId: 'site-01',
        circuitId: 'c-01',
        banMeisho: '1L-1',
        kairoBangou: '1',
        kairoMeisho: '電灯回路',
        phase: 1,
        status: 'conflict',
        clientConfirmedAt: '2026-10-08T10:00:00Z',
        serverCircuitData: { updatedAt: '2026-10-08T09:55:00Z' },
        payload: {},
      },
      {
        id: 'sync-02',
        siteId: 'site-01',
        circuitId: 'c-02',
        banMeisho: '1L-1',
        kairoBangou: '2',
        kairoMeisho: 'コンセント回路',
        phase: 2,
        status: 'conflict',
        clientConfirmedAt: '2026-10-08T10:00:00Z',
        serverCircuitData: { updatedAt: '2026-10-08T09:55:00Z' },
        payload: {},
      },
    ]

    const wrapper = mount(ModalSyncQueue, {
      props: {
        modelValue: true,
        siteId: 'site-01',
      },
    })

    expect(wrapper.text()).toContain('全 2 件の一括解決')

    const buttons = wrapper.findAllComponents({ name: 'Button' })
    const bulkDiscardBtn = buttons.find(b => b.text().includes('全件サーバー側を維持'))

    expect(bulkDiscardBtn).toBeDefined()
    await bulkDiscardBtn?.trigger('click')

    expect(resolveAllConflictsMock).toHaveBeenCalledWith('discard')
    expect(wrapper.emitted('synced')).toBeDefined()
  })
})
