import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'

import { resetMemoryTodos, useTodo } from '../../app/composables/portal/useTodo'

describe('useTodo', () => {
  beforeEach(() => {
    resetMemoryTodos()
  })

  it('initializes with empty todos list', () => {
    const { todos } = useTodo('site-1', 'user-1')

    expect(todos.value).toEqual([])
  })

  it('adds a new todo and ignores empty or whitespace-only text', () => {
    const { todos, addTodo } = useTodo('site-1', 'user-1')

    addTodo('')
    addTodo('   ')
    expect(todos.value.length).toBe(0)

    addTodo('  新規タスク  ')
    expect(todos.value.length).toBe(1)
    expect(todos.value[0].text).toBe('新規タスク')
    expect(todos.value[0].completed).toBe(false)
  })

  it('deletes a todo by id', () => {
    const { todos, addTodo, deleteTodo } = useTodo('site-1', 'user-1')

    addTodo('タスク1')
    addTodo('タスク2')
    expect(todos.value.length).toBe(2)

    const targetId = todos.value[0].id

    deleteTodo(targetId)
    expect(todos.value.length).toBe(1)
    expect(todos.value.find(t => t.id === targetId)).toBeUndefined()
  })

  it('sorts todos: uncompleted first, then by createdAt descending', () => {
    const { todos, rawTodos } = useTodo('site-1', 'user-1')

    rawTodos.value = [
      { id: '1', text: '完了タスク（古）', completed: true, createdAt: '2026-09-20T10:00:00.000Z' },
      { id: '2', text: '未完了タスク（古）', completed: false, createdAt: '2026-09-20T11:00:00.000Z' },
      { id: '3', text: '未完了タスク（新）', completed: false, createdAt: '2026-09-21T09:00:00.000Z' },
      { id: '4', text: '完了タスク（新）', completed: true, createdAt: '2026-09-21T10:00:00.000Z' },
    ]

    const texts = todos.value.map(t => t.text)

    expect(texts).toEqual([
      '未完了タスク（新）',
      '未完了タスク（古）',
      '完了タスク（新）',
      '完了タスク（古）',
    ])
  })

  it('switches storage when reactive siteIdSource changes', async () => {
    const siteIdRef = ref('site-a')
    const { todos, addTodo } = useTodo(siteIdRef, 'user-1')

    addTodo('現場Aのタスク')
    expect(todos.value.length).toBe(1)
    expect(todos.value[0].text).toBe('現場Aのタスク')

    // 現場Bに切り替え
    siteIdRef.value = 'site-b'
    await nextTick()
    expect(todos.value.length).toBe(0)

    addTodo('現場Bのタスク')
    expect(todos.value.length).toBe(1)
    expect(todos.value[0].text).toBe('現場Bのタスク')

    // 現場Aに戻す
    siteIdRef.value = 'site-a'
    await nextTick()
    expect(todos.value.length).toBe(1)
    expect(todos.value[0].text).toBe('現場Aのタスク')
  })

  it('PC等で削除されサーバー上から消えた同期済みToDoが、タブレット側のIndexedDBから復活せず削除されること', async () => {
    const { useNuxtApp } = await import('#app')
    const { TodosRepository } = await import('../../app/utils/db')
    const mockApi = useNuxtApp().$api as ReturnType<typeof import('vitest').vi.fn>

    // タブレット側のIndexedDBに、以前サーバーと同期済みだったタスク（todo-deleted-on-pc）が残っている状態を再現
    await TodosRepository.put({
      id: 'todo-deleted-on-pc',
      siteId: 'site-sync',
      userId: 'user-1',
      text: 'PCで削除されたタスク',
      completed: false,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
      isSynced: true,
    })

    // サーバー上では既にPCから削除されており、空配列が返る
    mockApi.mockClear()
    mockApi.mockResolvedValue({
      success: true,
      todos: [],
    })

    const { todos, load } = useTodo('site-sync', 'user-1')

    await load()

    // 1. 同期済みキャッシュ（isSynced: true）は localTodos としてサーバーへ再送（復活）されないこと
    expect(mockApi).toHaveBeenCalledWith(
      '/api/sites/site-sync/todos/sync',
      expect.objectContaining({
        method: 'POST',
        body: { localTodos: [] },
      }),
    )

    // 2. タブレット側のメモリおよび IndexedDB からも削除されていること
    expect(todos.value).toEqual([])
    const remainingInIdb = await TodosRepository.getBySiteAndUser('site-sync', 'user-1')

    expect(remainingInIdb).toEqual([])
  })
})
