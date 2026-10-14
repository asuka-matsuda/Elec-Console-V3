/**
 * 現場パーソナルToDo Composable (Local-First + Cloud Sync Architecture)
 *
 * @description ユーザー個人の現場作業ToDoの登録・完了切り替え・削除およびIndexedDB永続化・サーバーDB双方向同期を管理します。
 * メモリキャッシュとIndexedDBにより現場圏外（オフライン）時も0msで即時動作し、
 * オンライン時はサーバーDBと自動同期してスマホ⇄PC間でのシームレスな共有・既存タスク自動マイグレーションを提供します。
 * @param siteIdSource 対象現場ID（文字列値またはRef/Getter）
 * @param explicitLoginId ログインユーザー識別子（未指定時は currentUser.loginId を自動適用）
 */

import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue'

import { useNuxtApp } from '#app'
import { useAuth } from '~/composables/useAuth'
import { TodosRepository } from '~/utils/db'
import type { TodoRecord } from '~/utils/db/schema'

export type TodoItem = TodoRecord

// アプリケーション全体で共有されるインメモリキャッシュ
const memoryTodos = ref<TodoItem[]>([])

/**
 * テストまたはセッションリセット用全クリア
 */
export function resetMemoryTodos() {
  memoryTodos.value = []
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
  const { currentUser, getAccurateNowIso } = useAuth()
  const $api = getApiSafe()

  const currentSiteId = computed(() => toValue(siteIdSource))
  const currentUserId = computed(() => explicitLoginId || currentUser.value?.loginId || 'guest')

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

      const normalized: TodoItem[] = newItems.map((item, idx) => ({
        id: item.id || `todo-${Date.now()}-${idx}`,
        siteId: item.siteId || sId,
        userId: item.userId || uId,
        text: item.text || '',
        completed: Boolean(item.completed),
        createdAt: item.createdAt || currentIso,
        updatedAt: item.updatedAt || item.createdAt || currentIso,
      }))

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
        localItems = items
        const otherItems = memoryTodos.value.filter(t => !(t.siteId === sId && t.userId === uId))

        memoryTodos.value = [...otherItems, ...items]
      }
    }
    catch (err) {
      console.warn('[useTodo] Failed to load from IndexedDB', err)
    }

    // Step 2: サーバーへローカルタスクを同期（マイグレーション）し、最新の完全リストを取得
    if ($api && uId !== 'guest') {
      await safeApiCall(async () => {
        const res = await $api<{ success: boolean, todos: TodoItem[] }>(
          `/api/sites/${sId}/todos/sync`,
          {
            method: 'POST',
            body: { localTodos: localItems },
          },
        )

        if (res && res.todos) {
          // サーバーの最新タスクを IndexedDB に永続化
          for (const serverTodo of res.todos) {
            await TodosRepository.put(serverTodo).catch(() => {})
          }

          // メモリキャッシュを最新に更新
          const otherItems = memoryTodos.value.filter(t => !(t.siteId === sId && t.userId === uId))

          memoryTodos.value = [...otherItems, ...res.todos]
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
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    const newTodo: TodoItem = {
      id,
      siteId: sId,
      userId: uId,
      text: trimmed,
      completed: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    // 1. メモリキャッシュに即時反映 (0ms)
    memoryTodos.value.push(newTodo)

    // 2. IndexedDB に非同期保存
    TodosRepository.put(newTodo).catch((err) => {
      console.error('[useTodo] Failed to save todo to IndexedDB', err)
    })

    // 3. サーバーDBへ非同期同期（バックグラウンド）
    if ($api && uId !== 'guest') {
      safeApiCall(() => {
        return $api(`/api/sites/${sId}/todos/sync`, {
          method: 'POST',
          body: { localTodos: [newTodo] },
        })
      })
    }
  }

  // ToDo の削除
  const deleteTodo = (id: string) => {
    const sId = currentSiteId.value
    const uId = currentUserId.value

    memoryTodos.value = memoryTodos.value.filter(t => t.id !== id)

    // 1. IndexedDB から削除
    TodosRepository.delete(id).catch((err) => {
      console.error('[useTodo] Failed to delete todo from IndexedDB', err)
    })

    // 2. サーバーDB から削除
    if ($api && uId !== 'guest') {
      safeApiCall(() => {
        return $api(`/api/sites/${sId}/todos/${id}`, {
          method: 'DELETE',
        })
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

  // 完了フラグ等の変更（チェックボックス操作）を検知して IndexedDB および サーバーに保存
  watch(
    todos,
    (currentList) => {
      const sId = currentSiteId.value
      const uId = currentUserId.value

      for (const item of currentList) {
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
