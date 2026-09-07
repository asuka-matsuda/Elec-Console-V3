import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useOfflineSync } from '../../app/composables/portal/useOfflineSync'
import { STORAGE_KEYS } from '../../app/constants/storageKeys'

describe('useOfflineSync', () => {
  const siteId = 'test-site-01'

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('should initialize with empty queue', () => {
    const { queue, pendingCount, hasPending } = useOfflineSync(siteId)

    expect(queue.value).toEqual([])
    expect(pendingCount.value).toBe(0)
    expect(hasPending.value).toBe(false)
  })

  it('should enqueue new items and persist to localStorage', () => {
    const { enqueue, queue, pendingCount, hasPending } = useOfflineSync(siteId)

    enqueue({
      siteId,
      circuitId: 'circuit-001',
      banMeisho: '1F電灯盤',
      kairoBangou: '1',
      kairoMeisho: '事務室電灯',
      phase: 1,
      actionType: 'confirm',
      payload: { kakunin: true, mashishime: true },
      clientConfirmedAt: '2026-09-07T14:30:00.000Z',
    })

    expect(pendingCount.value).toBe(1)
    expect(hasPending.value).toBe(true)
    expect(queue.value[0].circuitId).toBe('circuit-001')
    expect(queue.value[0].status).toBe('pending')

    // localStorage の永続化確認
    const stored = localStorage.getItem(STORAGE_KEYS.OFFLINE_SYNC_QUEUE(siteId))

    expect(stored).not.toBeNull()
    expect(JSON.parse(stored!)).toHaveLength(1)
  })

  it('should merge/update existing item if same circuitId and phase are enqueued', () => {
    const { enqueue, queue, pendingCount } = useOfflineSync(siteId)

    enqueue({
      siteId,
      circuitId: 'circuit-001',
      banMeisho: '1F電灯盤',
      kairoBangou: '1',
      kairoMeisho: '事務室電灯',
      phase: 2,
      actionType: 'confirm',
      payload: { rVal: 50 },
      clientConfirmedAt: '2026-09-07T14:30:00.000Z',
    })

    expect(pendingCount.value).toBe(1)
    expect(queue.value[0].payload.rVal).toBe(50)

    // 同じ回路・同じフェーズで上書き更新
    enqueue({
      siteId,
      circuitId: 'circuit-001',
      banMeisho: '1F電灯盤',
      kairoBangou: '1',
      kairoMeisho: '事務室電灯',
      phase: 2,
      actionType: 'confirm',
      payload: { rVal: 100 },
      clientConfirmedAt: '2026-09-07T14:35:00.000Z',
    })

    expect(pendingCount.value).toBe(1)
    expect(queue.value[0].payload.rVal).toBe(100)
    expect(queue.value[0].clientConfirmedAt).toBe('2026-09-07T14:35:00.000Z')
  })

  it('should remove item by id', () => {
    const { enqueue, removeQueueItem, queue, pendingCount } = useOfflineSync(siteId)

    enqueue({
      siteId,
      circuitId: 'circuit-001',
      banMeisho: '1F電灯盤',
      kairoBangou: '1',
      kairoMeisho: '事務室電灯',
      phase: 1,
      actionType: 'confirm',
      payload: {},
      clientConfirmedAt: '2026-09-07T14:30:00.000Z',
    })

    const itemId = queue.value[0].id

    removeQueueItem(itemId)

    expect(pendingCount.value).toBe(0)
    expect(queue.value).toEqual([])
  })

  it('should clear all items with clearQueue', () => {
    const { enqueue, clearQueue, pendingCount } = useOfflineSync(siteId)

    enqueue({
      siteId,
      circuitId: 'c1',
      banMeisho: '盤A',
      kairoBangou: '1',
      kairoMeisho: '回路1',
      phase: 1,
      actionType: 'confirm',
      payload: {},
      clientConfirmedAt: '2026-09-07T14:30:00.000Z',
    })
    enqueue({
      siteId,
      circuitId: 'c2',
      banMeisho: '盤A',
      kairoBangou: '2',
      kairoMeisho: '回路2',
      phase: 1,
      actionType: 'confirm',
      payload: {},
      clientConfirmedAt: '2026-09-07T14:31:00.000Z',
    })

    expect(pendingCount.value).toBe(2)

    clearQueue()
    expect(pendingCount.value).toBe(0)
  })

  it('should sync all items successfully and empty the queue', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ success: true })
    const { enqueue, syncAll, pendingCount, queue } = useOfflineSync(siteId, {
      fetcher: fetchMock as unknown as typeof $fetch,
    })

    enqueue({
      siteId,
      circuitId: 'c1',
      banMeisho: '盤A',
      kairoBangou: '1',
      kairoMeisho: '回路1',
      phase: 1,
      actionType: 'confirm',
      payload: { kakunin: true },
      clientConfirmedAt: '2026-09-07T14:30:00.000Z',
    })

    const result = await syncAll()

    expect(result.total).toBe(1)
    expect(result.successCount).toBe(1)
    expect(result.conflictCount).toBe(0)
    expect(result.errorCount).toBe(0)
    expect(pendingCount.value).toBe(0)
    expect(queue.value).toHaveLength(0)

    // $fetch のペイロードに clientConfirmedAt と isOfflineSync が渡されていること
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/sites/test-site-01/circuits/c1/phase1',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          kakunin: true,
          clientConfirmedAt: '2026-09-07T14:30:00.000Z',
          isOfflineSync: true,
        }),
      }),
    )
  })

  it('should mark item as conflict when 409 Conflict occurs during sync', async () => {
    const error409 = {
      statusCode: 409,
      data: {
        message: '競合が発生しました',
        current: { updatedAt: '2026-09-07T15:00:00.000Z', zetsuenR: 100 },
      },
    }
    const fetchMock = vi.fn().mockRejectedValue(error409)

    const { enqueue, syncAll, queue, conflictCount } = useOfflineSync(siteId, {
      fetcher: fetchMock as unknown as typeof $fetch,
    })

    enqueue({
      siteId,
      circuitId: 'c1',
      banMeisho: '盤A',
      kairoBangou: '1',
      kairoMeisho: '回路1',
      phase: 2,
      actionType: 'confirm',
      payload: { rVal: 50 },
      clientConfirmedAt: '2026-09-07T14:30:00.000Z',
    })

    const result = await syncAll()

    expect(result.successCount).toBe(0)
    expect(result.conflictCount).toBe(1)
    expect(conflictCount.value).toBe(1)
    expect(queue.value[0].status).toBe('conflict')
    expect(queue.value[0].serverCircuitData).toEqual(error409.data.current)
  })
})
