import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'

import { useTodo } from '../../app/composables/portal/useTodo'

describe('useTodo', () => {
  beforeEach(() => {
    localStorage.clear()
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
})
