/**
 * 現場パーソナルToDo Composable (Local-First Architecture)
 *
 * @description ユーザー個人の現場作業ToDoの登録・完了切り替え・削除およびIndexedDB永続化を管理します。
 * メモリキャッシュとIndexedDBを組み合わせ、現場切り替え時も0msで即時リアクティブにフィルタリングされます。
 * @param siteIdSource 対象現場ID（文字列値またはRef/Getter）
 * @param explicitLoginId ログインユーザー識別子（未指定時は currentUser.loginId を自動適用）
 */

import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue'

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

export function useTodo(
  siteIdSource: MaybeRefOrGetter<string>,
  explicitLoginId?: string,
) {
  const { currentUser, getAccurateNowIso } = useAuth()

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

  // IndexedDB からデータを読み込み
  const load = async () => {
    const sId = currentSiteId.value
    const uId = currentUserId.value

    if (!sId || !uId) return

    try {
      const items = await TodosRepository.getBySiteAndUser(sId, uId)

      if (items && items.length > 0) {
        // メモリキャッシュにマージ
        const otherItems = memoryTodos.value.filter(t => !(t.siteId === sId && t.userId === uId))

        memoryTodos.value = [...otherItems, ...items]
      }
    }
    catch (err) {
      console.error('[useTodo] Failed to load from IndexedDB', err)
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
  }

  // ToDo の削除
  const deleteTodo = (id: string) => {
    memoryTodos.value = memoryTodos.value.filter(t => t.id !== id)

    TodosRepository.delete(id).catch((err) => {
      console.error('[useTodo] Failed to delete todo from IndexedDB', err)
    })
  }

  // 現場/ユーザー切り替え時に IndexedDB から最新取得
  watch(
    [currentSiteId, currentUserId],
    () => {
      load()
    },
    { immediate: true },
  )

  // 完了フラグ等の変更（チェックボックス操作）を検知して IndexedDB に保存
  watch(
    todos,
    (currentList) => {
      for (const item of currentList) {
        TodosRepository.put(item).catch(() => {})
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
