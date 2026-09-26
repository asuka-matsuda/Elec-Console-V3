/**
 * オフライン同期キュー管理 Composable
 *
 * @description ネットワーク圏外時に実行された試験確定・解除操作をローカルストレージにキューイングし、復帰時に自動再送・同期します。
 * @param siteId 対象現場IDのRef
 */

import type { Ref } from 'vue'
import { computed, getCurrentInstance, onMounted, onUnmounted } from 'vue'

import { useState } from '#app'
import { useApi } from '~/composables/useApi'
import { STATE_KEYS, STORAGE_KEYS } from '~/constants/storageKeys'
import { AppException } from '~/utils/errors'

export interface PendingSyncItem {
  id: string
  siteId: string
  circuitId: string
  banMeisho: string
  kairoBangou: string
  kairoMeisho: string
  phase: 1 | 2 | 3
  actionType: 'confirm' | 'clear'
  payload: Record<string, unknown>
  clientConfirmedAt: string
  expectedUpdatedAt?: string
  expectedVersion?: number
  workerName?: string
  createdAt: string
  status: 'pending' | 'syncing' | 'conflict' | 'error'
  errorMessage?: string
  serverCircuitData?: Record<string, unknown>
}

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
  const { $api } = useApi()
  const currentSiteId = computed(() => typeof siteIdRef === 'string' ? siteIdRef : siteIdRef.value)
  const queue = useState<PendingSyncItem[]>(
    STATE_KEYS.OFFLINE_SYNC_QUEUE(currentSiteId.value),
    () => [],
  )
  const isSyncing = useState<boolean>(
    STATE_KEYS.OFFLINE_SYNC_SYNCING(currentSiteId.value),
    () => false,
  )
  const fetchFn = options?.fetcher || $api

  // ローカルストレージからキューを読み込み
  const loadQueue = () => {
    if (!import.meta.client || !currentSiteId.value) return

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_SYNC_QUEUE(currentSiteId.value))

      if (raw) {
        queue.value = JSON.parse(raw) as PendingSyncItem[]
      }
      else {
        queue.value = []
      }
    }
    catch {
      queue.value = []
    }
  }

  // ローカルストレージにキューを保存
  const saveQueue = () => {
    if (!import.meta.client || !currentSiteId.value) return

    try {
      localStorage.setItem(
        STORAGE_KEYS.OFFLINE_SYNC_QUEUE(currentSiteId.value),
        JSON.stringify(queue.value),
      )
    }
    catch (err) {
      console.error('[OfflineSync] Failed to save queue to localStorage', err)
    }
  }

  // キューにアイテムを追加（同回路・同フェーズの未同期があれば最新値で更新）
  const enqueue = (item: Omit<PendingSyncItem, 'id' | 'createdAt' | 'status'>) => {
    const existingIndex = queue.value.findIndex(
      q => q.circuitId === item.circuitId && q.phase === item.phase && q.status !== 'conflict',
    )

    const newItem: PendingSyncItem = {
      ...item,
      id: `${item.circuitId}_${item.phase}_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    }

    if (existingIndex >= 0) {
      queue.value[existingIndex] = newItem
    }
    else {
      queue.value.push(newItem)
    }

    saveQueue()
  }

  // キューからアイテムを削除
  const removeQueueItem = (id: string) => {
    queue.value = queue.value.filter(item => item.id !== id)
    saveQueue()
  }

  // キューを全クリア
  const clearQueue = () => {
    queue.value = []
    saveQueue()
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
        removeQueueItem(item.id)
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
          // 競合発生
          item.status = 'conflict'
          item.errorMessage = '別の作業者によって更新されています'
          item.serverCircuitData = (appErr?.details?.currentCircuit as Record<string, unknown> | undefined)
            || fetchErr.data?.data?.currentCircuit
            || fetchErr.data?.current
            || fetchErr.originalError?.data?.data?.currentCircuit
            || fetchErr.originalError?.data?.current

          result.conflictCount++
          result.conflicts.push(item)
        }
        else {
          item.status = 'error'
          item.errorMessage = appErr ? appErr.getUserFacingMessage() : (fetchErr.data?.message || '送信エラーが発生しました')
          result.errorCount++
        }
      }
    }

    saveQueue()
    isSyncing.value = false

    return result
  }

  // 競合の解決
  const resolveConflict = async (itemId: string, resolution: 'overwrite' | 'discard') => {
    const item = queue.value.find(q => q.id === itemId)

    if (!item) return

    if (resolution === 'discard') {
      removeQueueItem(itemId)

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

        removeQueueItem(itemId)
      }
      catch (err) {
        console.error('[OfflineSync] Overwrite failed', err)
      }
    }
  }

  // 離脱時警告ハンドラ
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (queue.value.length > 0) {
      event.preventDefault()
      event.returnValue = '未同期の測定データがあります。'
    }
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      loadQueue()

      if (import.meta.client) {
        window.addEventListener('beforeunload', handleBeforeUnload)
      }
    })

    onUnmounted(() => {
      if (import.meta.client) {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    })
  }
  else {
    loadQueue()
  }

  const pendingCount = computed(() => queue.value.length)
  const hasPending = computed(() => queue.value.length > 0)
  const conflictCount = computed(() => queue.value.filter(q => q.status === 'conflict').length)

  return {
    queue,
    isSyncing,
    pendingCount,
    hasPending,
    conflictCount,
    loadQueue,
    enqueue,
    removeQueueItem,
    clearQueue,
    syncAll,
    resolveConflict,
  }
}
