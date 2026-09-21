/**
 * 現場パーソナルToDo Composable
 *
 * @description ユーザー個人の現場作業ToDoの登録・完了切り替え・削除およびLocalStorage永続化を管理します。
 * @param {Ref<string>} siteId 対象現場IDのRef
 */

import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue'

import { STORAGE_KEYS } from '~/constants/storageKeys'

export interface TodoItem {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

export const useTodo = (
  siteIdSource: MaybeRefOrGetter<string>,
  loginId = 'guest',
) => {
  const storageKey = computed(() =>
    STORAGE_KEYS.PORTAL_TODOS(toValue(siteIdSource), loginId),
  )

  const rawTodos = ref<TodoItem[]>([])
  let isSyncing = false

  const load = (key: string) => {
    if (typeof localStorage === 'undefined') {
      rawTodos.value = []

      return
    }

    try {
      const item = localStorage.getItem(key)

      isSyncing = true
      rawTodos.value = item ? JSON.parse(item) : []
    }
    catch {
      rawTodos.value = []
    }
    finally {
      isSyncing = false
    }
  }

  // キーの変更に同期して即時再ロード
  watch(
    storageKey,
    (key) => {
      load(key)
    },
    { immediate: true, flush: 'sync' },
  )

  // データ変更時に同期して即時保存
  watch(
    rawTodos,
    (newVal) => {
      if (isSyncing || typeof localStorage === 'undefined') return
      localStorage.setItem(storageKey.value, JSON.stringify(newVal))
    },
    { deep: true, flush: 'sync' },
  )

  // 未完了優先、作成日時降順のソート済みリスト（Dateインスタンス化不要の高速比較）
  const todos = computed(() => {
    return [...rawTodos.value].sort((a, b) => {
      return (
        Number(a.completed) - Number(b.completed)
        || b.createdAt.localeCompare(a.createdAt)
      )
    })
  })

  const addTodo = (text: string) => {
    const trimmed = text.trim()

    if (!trimmed) return
    const id
      = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    rawTodos.value.push({
      id,
      text: trimmed,
      completed: false,
      createdAt: new Date().toISOString(),
    })
  }

  const deleteTodo = (id: string) => {
    rawTodos.value = rawTodos.value.filter(t => t.id !== id)
  }

  return {
    todos,
    rawTodos,
    addTodo,
    deleteTodo,
  }
}
