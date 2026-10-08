/**
 * オフライン同期キュー (Outbox) 管理 Composable
 *
 * @description 現場作業時に発生した試験確定・解除操作をローカル IndexedDB に安全にキューイングし、
 * ネットワーク復帰時に自動/手動で再送・同期・競合解決を行います。
 * UIへはゼロレイテンシで即時反映（楽観的更新）されます。
 */

import type { Ref } from 'vue'
import { computed, getCurrentInstance, onMounted, onUnmounted } from 'vue'

import { useNuxtApp, useState } from '#app'
import { STATE_KEYS } from '~/constants/storageKeys'
import { OutboxRepository } from '~/utils/db'
import type { SyncOutboxRecord } from '~/utils/db/schema'
import { AppException } from '~/utils/errors'

export type PendingSyncItem = SyncOutboxRecord

export interface SyncResult {
  total: number
  successCount: number
  conflictCount: number
  errorCount: number
  conflicts: PendingSyncItem[]
}

interface UseOfflineSyncOptions {
  fetcher?: typeof $fetch
}

export function useOfflineSync(
  siteIdRef: Ref<string> | string,
  options?: UseOfflineSyncOptions,
) {
  const { $api } = useNuxtApp()
  const { getAccurateNowIso } = useAuth()
  const currentSiteId = computed(() => typeof siteIdRef === 'string' ? siteIdRef : siteIdRef.value)
  const queue = useState<PendingSyncItem[]>(
    STATE_KEYS.OFFLINE_SYNC_QUEUE(currentSiteId.value),
    () => [],
  )
  const isSyncing = useState<boolean>(
    STATE_KEYS.OFFLINE_SYNC_SYNCING(currentSiteId.value),
    () => false,
  )
  const lastSyncedAt = useState<string | null>(
    STATE_KEYS.OFFLINE_SYNC_LAST_SYNCED_AT(currentSiteId.value),
    () => null,
  )
  const fetchFn = options?.fetcher || $api

  // IndexedDBからキューを読み込み
  const loadQueue = async () => {
    if (!import.meta.client || !currentSiteId.value) return

    try {
      const items = await OutboxRepository.getBySite(currentSiteId.value)

      if (items) {
        queue.value = items
      }
    }
    catch (err) {
      console.error('[OfflineSync] Failed to load queue from IndexedDB', err)
    }
  }

  // キューにアイテムを追加（IndexedDBへ永続化し、メモリキューへ反映）
  const enqueue = async (item: Omit<PendingSyncItem, 'id' | 'createdAt' | 'status'>): Promise<PendingSyncItem | undefined> => {
    if (!currentSiteId.value) return undefined

    try {
      const record = await OutboxRepository.enqueue(item)

      if (record) {
        const existingIndex = queue.value.findIndex(
          q => q.circuitId === item.circuitId && q.phase === item.phase && q.status !== 'conflict',
        )

        if (existingIndex >= 0) {
          queue.value[existingIndex] = record
        }
        else {
          queue.value.push(record)
        }

        return record
      }
    }
    catch (err) {
      console.error('[OfflineSync] Failed to enqueue to IndexedDB', err)
    }

    return undefined
  }

  // キューからアイテムを削除
  const removeQueueItem = async (id: string) => {
    queue.value = queue.value.filter(item => item.id !== id)
    try {
      await OutboxRepository.remove(id)
    }
    catch (err) {
      console.error('[OfflineSync] Failed to remove item from IndexedDB', err)
    }
  }

  // キューを全クリア
  const clearQueue = async () => {
    queue.value = []
    if (currentSiteId.value) {
      try {
        await OutboxRepository.clearSite(currentSiteId.value)
      }
      catch (err) {
        console.error('[OfflineSync] Failed to clear queue in IndexedDB', err)
      }
    }
  }

  // 全アイテムの手動同期を実行
  const syncAll = async (): Promise<SyncResult> => {
    if (isSyncing.value || queue.value.length === 0) {
      return {
        total: queue.value.length,
        successCount: 0,
        conflictCount: 0,
        errorCount: 0,
        conflicts: [],
      }
    }

    isSyncing.value = true

    const result: SyncResult = {
      total: queue.value.length,
      successCount: 0,
      conflictCount: 0,
      errorCount: 0,
      conflicts: [],
    }

    const itemsToSync = [...queue.value]

    for (const item of itemsToSync) {
      // 競合状態のアイテムは手動解決されるまでスキップ
      if (item.status === 'conflict') {
        result.conflictCount++
        result.conflicts.push(item)
        continue
      }

      OutboxRepository.updateStatus(item.id, 'syncing').catch(() => {})
      item.status = 'syncing'

      try {
        const endpoint = item.actionType === 'clear'
          ? `/api/sites/${item.siteId}/circuits/${item.circuitId}/phase${item.phase}/clear`
          : `/api/sites/${item.siteId}/circuits/${item.circuitId}/phase${item.phase}`

        await fetchFn(endpoint, {
          method: 'POST',
          body: {
            ...item.payload,
            clientConfirmedAt: item.clientConfirmedAt,
            isOfflineSync: true,
            expectedUpdatedAt: item.expectedUpdatedAt,
            expectedVersion: item.expectedVersion,
          },
        })

        // 送信成功したアイテムはキューから除去
        await removeQueueItem(item.id)
        result.successCount++
      }
      catch (err: unknown) {
        const fetchErr = err as {
          statusCode?: number
          status?: number
          data?: {
            message?: string
            current?: Record<string, unknown>
            data?: { currentCircuit?: Record<string, unknown> }
          }
          details?: Record<string, unknown>
          originalError?: {
            data?: {
              current?: Record<string, unknown>
              data?: { currentCircuit?: Record<string, unknown> }
            }
            current?: Record<string, unknown>
          }
        }
        const appErr = err instanceof AppException ? err : null
        const status = appErr ? appErr.statusCode : (fetchErr.statusCode || fetchErr.status)

        if (status === 409) {
          // 競合発生 (409 Conflict)
          const serverData = (appErr?.details?.currentCircuit as Record<string, unknown> | undefined)
            || fetchErr.data?.data?.currentCircuit
            || fetchErr.data?.current
            || fetchErr.originalError?.data?.data?.currentCircuit
            || fetchErr.originalError?.current

          const errorMsg = '別の作業者によって更新されています'

          OutboxRepository.updateStatus(item.id, 'conflict', errorMsg, serverData).catch(() => {})
          item.status = 'conflict'
          item.errorMessage = errorMsg
          item.serverCircuitData = serverData

          result.conflictCount++
          result.conflicts.push(item)
        }
        else {
          const errorMsg = appErr ? appErr.getUserFacingMessage() : (fetchErr.data?.message || '送信エラーが発生しました')

          OutboxRepository.updateStatus(item.id, 'error', errorMsg).catch(() => {})
          item.status = 'error'
          item.errorMessage = errorMsg
          result.errorCount++
        }
      }
    }

    isSyncing.value = false

    if (result.successCount > 0) {
      lastSyncedAt.value = getAccurateNowIso()
    }

    return result
  }

  // 競合の解決
  const resolveConflict = async (itemId: string, resolution: 'overwrite' | 'discard') => {
    const item = queue.value.find(q => q.id === itemId)

    if (!item) return

    if (resolution === 'discard') {
      await removeQueueItem(itemId)
      lastSyncedAt.value = getAccurateNowIso()

      return
    }

    // 上書きの場合：サーバーの最新 updatedAt / version をセットして再送信
    if (resolution === 'overwrite') {
      const serverUpdated = item.serverCircuitData?.updatedAt as string | undefined
      const serverVersion = typeof item.serverCircuitData?.version === 'number'
        ? item.serverCircuitData.version
        : undefined

      try {
        const endpoint = item.actionType === 'clear'
          ? `/api/sites/${item.siteId}/circuits/${item.circuitId}/phase${item.phase}/clear`
          : `/api/sites/${item.siteId}/circuits/${item.circuitId}/phase${item.phase}`

        await fetchFn(endpoint, {
          method: 'POST',
          body: {
            ...item.payload,
            clientConfirmedAt: item.clientConfirmedAt,
            isOfflineSync: true,
            expectedUpdatedAt: serverUpdated,
            expectedVersion: serverVersion,
          },
        })

        await removeQueueItem(itemId)
        lastSyncedAt.value = getAccurateNowIso()
      }
      catch (err) {
        console.error('[OfflineSync] Overwrite failed', err)
      }
    }
  }

  // 全競合の一括解決
  const resolveAllConflicts = async (resolution: 'overwrite' | 'discard') => {
    const conflicts = queue.value.filter(q => q.status === 'conflict')

    for (const item of conflicts) {
      await resolveConflict(item.id, resolution)
    }
  }

  // 離脱時警告ハンドラ
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (queue.value.length > 0) {
      event.preventDefault()
      event.returnValue = '未同期の測定データがあります。'
    }
  }

  // オンライン復帰時の自動バックグラウンド同期ハンドラ
  const handleOnlineSync = () => {
    if (queue.value.length > 0 && !isSyncing.value) {
      syncAll().catch((err) => {
        console.warn('[OfflineSync] Auto background sync failed', err)
      })
    }
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      loadQueue()

      if (import.meta.client) {
        window.addEventListener('beforeunload', handleBeforeUnload)
        window.addEventListener('online', handleOnlineSync)
      }
    })

    onUnmounted(() => {
      if (import.meta.client) {
        window.removeEventListener('beforeunload', handleBeforeUnload)
        window.removeEventListener('online', handleOnlineSync)
      }
    })
  }

  const pendingCount = computed(() => queue.value.length)
  const hasPending = computed(() => queue.value.length > 0)
  const conflictCount = computed(() => queue.value.filter(q => q.status === 'conflict').length)

  return {
    queue,
    isSyncing,
    lastSyncedAt,
    pendingCount,
    hasPending,
    conflictCount,
    loadQueue,
    enqueue,
    removeQueueItem,
    clearQueue,
    syncAll,
    resolveConflict,
    resolveAllConflicts,
  }
}
