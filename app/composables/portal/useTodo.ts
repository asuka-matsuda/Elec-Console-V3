/**
 * 現場パーソナルToDo Composable (Local-First + Cloud Sync Architecture)
 *
 * @description ユーザー個人の現場作業ToDoの登録・完了切り替え・削除およびIndexedDB永続化・サーバーDB双方向同期を管理します。
 * メモリキャッシュとIndexedDBにより現場圏外（オフライン）時も0msで即時動作し、
 * オンライン時はサーバーDBと自動同期してスマホ⇄PC間でのシームレスな共有・既存タスク自動マイグレーションを提供します。
 * @param siteIdSource 対象現場ID（文字列値またはRef/Getter）
 * @param explicitLoginId ログインユーザー識別子（未指定時は currentUser.loginId を自動適用）
 */

import { computed, getCurrentInstance, type MaybeRefOrGetter, onMounted, onUnmounted, ref, toValue, watch } from 'vue'

import { useNuxtApp } from '#app'
import { useAuth } from '~/composables/useAuth'
import { generateUuid } from '~/utils/crypto'
import { TodosRepository } from '~/utils/db'
import type { TodoRecord } from '~/utils/db/schema'

export type TodoItem = TodoRecord

// アプリケーション全体で共有されるインメモリキャッシュ
const memoryTodos = ref<TodoItem[]>([])
// オフライン削除時に次回 sync でサーバーへ伝播させる削除済みIDセット
const pendingDeletedIds = new Set<string>()

/**
 * テストまたはセッションリセット用全クリア
 */
export function resetMemoryTodos() {
  memoryTodos.value = []
  pendingDeletedIds.clear()
}

function getApiSafe() {
  try {
    return useNuxtApp().$api
  }
  catch {
    return null
  }
}

async function safeApiCall(fn: () => Promise<unknown> | unknown) {
  try {
    const res = fn()

    if (res && typeof (res as Promise<unknown>).then === 'function') {
      await res
    }
  }
  catch {
    // 圏外（オフライン）時やテスト環境でのエラーは安全に無視
  }
}

export function useTodo(
  siteIdSource: MaybeRefOrGetter<string>,
  explicitLoginId?: string,
) {
  const { currentUser, getAccurateNow, getAccurateNowIso } = useAuth()
  const $api = getApiSafe()

  const currentSiteId = computed(() => toValue(siteIdSource))
  const currentUserId = computed(() => explicitLoginId || currentUser.value?.loginId || 'guest')
  const syncedStateMap = new Map<string, string>()

  const getTodoSignature = (item: Pick<TodoItem, 'completed' | 'text'>) => `${item.completed ? '1' : '0'}:${item.text}`

  // 現在の現場 & ユーザーに合致するタスクをリアクティブに抽出・ソート
  const todos = computed(() => {
    const sId = currentSiteId.value
    const uId = currentUserId.value

    return memoryTodos.value
      .filter(t => t.siteId === sId && t.userId === uId)
      .sort((a, b) => {
        return (
          Number(a.completed) - Number(b.completed)
          || b.createdAt.localeCompare(a.createdAt)
        )
      })
  })

  // 内部アクセス用の rawTodos 参照（配列の直接操作やバインド用）
  const rawTodos = computed({
    get: () => todos.value,
    set: (newItems: Partial<TodoItem>[]) => {
      const sId = currentSiteId.value
      const uId = currentUserId.value
      const currentIso = getAccurateNowIso()
      const nowMs = getAccurateNow().getTime()

      const normalized: TodoItem[] = newItems.map((item, idx) => {
        const todo: TodoItem = {
          id: item.id || `todo-${nowMs}-${idx}`,
          siteId: item.siteId || sId,
          userId: item.userId || uId,
          text: item.text || '',
          completed: Boolean(item.completed),
          createdAt: item.createdAt || currentIso,
          updatedAt: item.updatedAt || item.createdAt || currentIso,
        }

        syncedStateMap.set(todo.id, getTodoSignature(todo))

        return todo
      })

      // 他の現場・ユーザーのタスクを保持しつつ、現在のタスクを置換
      memoryTodos.value = [
        ...memoryTodos.value.filter(t => !(t.siteId === sId && t.userId === uId)),
        ...normalized,
      ]
    },
  })

  // 1. IndexedDB からローカル読込 ＆ 2. サーバーと双方向同期（自動マイグレーション）
  const load = async () => {
    const sId = currentSiteId.value
    const uId = currentUserId.value

    if (!sId || !uId) return

    let localItems: TodoItem[] = []

    // Step 1: まずローカル IndexedDB から即座に読み込み（0ms レスポンス）
    try {
      const items = await TodosRepository.getBySiteAndUser(sId, uId)

      if (items && items.length > 0) {
        localItems = items.filter(item => !pendingDeletedIds.has(item.id))
        for (const item of localItems) {
          syncedStateMap.set(item.id, getTodoSignature(item))
        }
        const otherItems = memoryTodos.value.filter(t => !(t.siteId === sId && t.userId === uId))

        memoryTodos.value = [...otherItems, ...localItems]
      }
    }
    catch (err) {
      console.warn('[useTodo] Failed to load from IndexedDB', err)
    }

    // Step 2: オフライン未同期の新規タスクのみサーバーへ送信し、サーバーの最新完全リストと同期
    // （既に同期済みのローカルキャッシュを localTodos として再送すると、他端末で削除されたタスクが復活してしまうため除外）
    if ($api && uId !== 'guest') {
      await safeApiCall(async () => {
        const deletedIdsToSend = Array.from(pendingDeletedIds)
        const unsyncedLocalTodos = localItems.filter(item => item.isSynced === false)
        const res = await $api<{ success: boolean, todos: TodoItem[] }>(
          `/api/sites/${sId}/todos/sync`,
          {
            method: 'POST',
            body: {
              localTodos: unsyncedLocalTodos,
              ...(deletedIdsToSend.length > 0 ? { deletedIds: deletedIdsToSend } : {}),
            },
          },
        )

        if (res && res.todos) {
          for (const delId of deletedIdsToSend) {
            pendingDeletedIds.delete(delId)
          }

          const serverIdSet = new Set(res.todos.map(t => t.id))

          // 他端末（PC等）で削除されたタスクをローカル IndexedDB からも確実に削除
          for (const localItem of localItems) {
            if (!serverIdSet.has(localItem.id)) {
              syncedStateMap.delete(localItem.id)
              await TodosRepository.delete(localItem.id).catch(() => {})
            }
          }

          // サーバーの最新タスクを IndexedDB に永続化（userId は現在の loginId に正規化、isSynced: true を付与）
          const normalizedServerTodos: TodoItem[] = res.todos.map(serverTodo => ({
            ...serverTodo,
            userId: uId,
            isSynced: true,
          }))

          for (const serverTodo of normalizedServerTodos) {
            syncedStateMap.set(serverTodo.id, getTodoSignature(serverTodo))
            await TodosRepository.put(serverTodo).catch(() => {})
          }

          // メモリキャッシュを最新に更新
          const otherItems = memoryTodos.value.filter(t => !(t.siteId === sId && t.userId === uId))

          memoryTodos.value = [...otherItems, ...normalizedServerTodos]
        }
      })
    }
  }

  // ToDo の追加
  const addTodo = (text: string) => {
    const trimmed = text.trim()

    if (!trimmed) return

    const sId = currentSiteId.value
    const uId = currentUserId.value
    const nowIso = getAccurateNowIso()
    const id = generateUuid()

    const newTodo: TodoItem = {
      id,
      siteId: sId,
      userId: uId,
      text: trimmed,
      completed: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      isSynced: false,
    }

    syncedStateMap.set(newTodo.id, getTodoSignature(newTodo))

    // 1. メモリキャッシュに即時反映 (0ms)
    memoryTodos.value.push(newTodo)

    // 2. IndexedDB に非同期保存（オフライン時は isSynced: false のまま保持される）
    TodosRepository.put(newTodo).catch((err) => {
      console.error('[useTodo] Failed to save todo to IndexedDB', err)
    })

    // 3. サーバーDBへ非同期同期（成功したら isSynced: true に更新）
    if ($api && uId !== 'guest') {
      safeApiCall(async () => {
        await $api(`/api/sites/${sId}/todos/sync`, {
          method: 'POST',
          body: { localTodos: [newTodo] },
        })
        const syncedTodo: TodoItem = { ...newTodo, isSynced: true }
        const idx = memoryTodos.value.findIndex(t => t.id === id)

        if (idx !== -1) {
          memoryTodos.value[idx] = syncedTodo
        }
        await TodosRepository.put(syncedTodo).catch(() => {})
      })
    }
  }

  // ToDo の削除
  const deleteTodo = (id: string) => {
    const sId = currentSiteId.value
    const uId = currentUserId.value

    syncedStateMap.delete(id)
    pendingDeletedIds.add(id)
    memoryTodos.value = memoryTodos.value.filter(t => t.id !== id)

    // 1. IndexedDB から削除
    TodosRepository.delete(id).catch((err) => {
      console.error('[useTodo] Failed to delete todo from IndexedDB', err)
    })

    // 2. サーバーDB から削除
    if ($api && uId !== 'guest') {
      safeApiCall(async () => {
        await $api(`/api/sites/${sId}/todos/${id}`, {
          method: 'DELETE',
        })
        pendingDeletedIds.delete(id)
      })
    }
  }

  // 現場/ユーザー切り替え時に IndexedDB から最新取得 & サーバー同期
  watch(
    [currentSiteId, currentUserId],
    () => {
      load()
    },
    { immediate: true },
  )

  // 別端末（PC ⇄ タブレット）での追加・削除を画面復帰時やオンライン復帰時に自動反映
  if (getCurrentInstance() && typeof window !== 'undefined') {
    const handleVisibilityOrFocus = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        load()
      }
    }

    onMounted(() => {
      window.addEventListener('focus', handleVisibilityOrFocus)
      window.addEventListener('online', handleVisibilityOrFocus)
      document.addEventListener('visibilitychange', handleVisibilityOrFocus)
    })

    onUnmounted(() => {
      window.removeEventListener('focus', handleVisibilityOrFocus)
      window.removeEventListener('online', handleVisibilityOrFocus)
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
    })
  }

  // 完了フラグ等の変更（チェックボックス操作）を検知して、変更があったアイテムのみ IndexedDB および サーバーに保存
  watch(
    todos,
    (currentList) => {
      const sId = currentSiteId.value
      const uId = currentUserId.value

      for (const item of currentList) {
        const sig = getTodoSignature(item)

        if (syncedStateMap.get(item.id) === sig) {
          continue
        }

        syncedStateMap.set(item.id, sig)
        TodosRepository.put(item).catch(() => {})

        if ($api && uId !== 'guest') {
          safeApiCall(() => {
            return $api(`/api/sites/${sId}/todos/${item.id}`, {
              method: 'PUT',
              body: {
                text: item.text,
                completed: item.completed,
              },
            })
          })
        }
      }
    },
    { deep: true },
  )

  return {
    todos,
    rawTodos,
    addTodo,
    deleteTodo,
    load,
  }
}
