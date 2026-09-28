import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useOfflineSync } from '../../app/composables/portal/useOfflineSync'
import { OutboxRepository } from '../../app/utils/db'

describe('useOfflineSync', () => {
  const siteId = 'test-site-01'

  beforeEach(async () => {
    vi.restoreAllMocks()
    const { clearQueue } = useOfflineSync(siteId)

    await clearQueue()
  })

  it('should initialize with empty queue', () => {
    const { queue, pendingCount, hasPending } = useOfflineSync(siteId)

    expect(queue.value).toEqual([])
    expect(pendingCount.value).toBe(0)
    expect(hasPending.value).toBe(false)
  })

  it('should enqueue new items and persist to IndexedDB Outbox', async () => {
    const { enqueue, queue, pendingCount, hasPending } = useOfflineSync(siteId)

    await enqueue({
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

    // IndexedDB の永続化確認
    const stored = await OutboxRepository.getBySite(siteId)

    expect(stored).toHaveLength(1)
    expect(stored[0].circuitId).toBe('circuit-001')
  })

  it('should merge/update existing item if same circuitId and phase are enqueued', async () => {
    const { enqueue, queue, pendingCount } = useOfflineSync(siteId)

    await enqueue({
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
    await enqueue({
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

  it('should remove item by id', async () => {
    const { enqueue, removeQueueItem, queue, pendingCount } = useOfflineSync(siteId)

    await enqueue({
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

    await removeQueueItem(itemId)

    expect(pendingCount.value).toBe(0)
    expect(queue.value).toEqual([])
  })

  it('should clear all items with clearQueue', async () => {
    const { enqueue, clearQueue, pendingCount } = useOfflineSync(siteId)

    await enqueue({
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
    await enqueue({
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

    await clearQueue()
    expect(pendingCount.value).toBe(0)
  })

  it('should sync all items successfully and empty the queue', async () => {
    const mockFetcher = vi.fn().mockResolvedValue({ success: true })
    const { enqueue, syncAll, pendingCount } = useOfflineSync(siteId, { fetcher: mockFetcher })

    await enqueue({
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

    const result = await syncAll()

    expect(result.total).toBe(1)
    expect(result.successCount).toBe(1)
    expect(result.conflictCount).toBe(0)
    expect(result.errorCount).toBe(0)
    expect(pendingCount.value).toBe(0)
    expect(mockFetcher).toHaveBeenCalledTimes(1)
  })

  it('should mark item as conflict when 409 Conflict occurs during sync', async () => {
    const conflictError = {
      statusCode: 409,
      data: {
        message: 'Conflict',
        current: { p1ConfirmedAt: '2026-09-07T15:00:00.000Z' },
      },
    }
    const mockFetcher = vi.fn().mockRejectedValue(conflictError)
    const { enqueue, syncAll, queue, conflictCount } = useOfflineSync(siteId, { fetcher: mockFetcher })

    await enqueue({
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

    const result = await syncAll()

    expect(result.successCount).toBe(0)
    expect(result.conflictCount).toBe(1)
    expect(conflictCount.value).toBe(1)
    expect(queue.value[0].status).toBe('conflict')
    expect(queue.value[0].errorMessage).toBe('別の作業者によって更新されています')
  })

  it('shares reactive queue state across multiple useOfflineSync instances for the same siteId', async () => {
    const instanceA = useOfflineSync(siteId)
    const instanceB = useOfflineSync(siteId)

    await instanceA.enqueue({
      siteId,
      circuitId: 'circuit-shared-01',
      banMeisho: '共有盤',
      kairoBangou: '1',
      kairoMeisho: '共用部',
      phase: 1,
      actionType: 'confirm',
      payload: {},
      clientConfirmedAt: '2026-09-07T14:30:00.000Z',
    })

    // instanceB でもリアクティブに即時反映される
    expect(instanceB.pendingCount.value).toBe(1)
    expect(instanceB.hasPending.value).toBe(true)
    expect(instanceB.queue.value[0].circuitId).toBe('circuit-shared-01')
  })
})
