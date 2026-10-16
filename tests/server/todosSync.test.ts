import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import deleteTodoHandler from '../../server/api/sites/[siteId]/todos/[id].delete'
import updateTodoHandler from '../../server/api/sites/[siteId]/todos/[id].put'
import syncTodosHandler from '../../server/api/sites/[siteId]/todos/sync.post'
import { hashPassword } from '../../server/utils/password'
import { prisma } from '../../server/utils/prisma'
import { ErrorCode } from '../../shared/types/errors'
import { createTestH3Event } from '../helpers/h3TestHelper'

describe('Todos API Handlers (Sync, Update, Delete & Viewer Role Protection)', () => {
  const testSiteId = 'test-site-todo-api-01'
  let workerUser: { id: string, loginId: string, role: string, password: string }
  let otherWorkerUser: { id: string, loginId: string, role: string, password: string }
  let viewerUser: { id: string, loginId: string, role: string, password: string }

  const cleanup = async () => {
    await prisma.todo.deleteMany({ where: { siteId: testSiteId } })
    await prisma.userOnSite.deleteMany({ where: { siteId: testSiteId } })
    await prisma.site.deleteMany({ where: { id: testSiteId } })
    await prisma.user.deleteMany({
      where: { loginId: { in: ['test_todo_worker1', 'test_todo_worker2', 'test_todo_viewer'] } },
    })
  }

  beforeAll(async () => {
    await cleanup()

    await prisma.site.create({
      data: {
        id: testSiteId,
        name: 'ToDo APIテスト現場',
        status: 'active',
      },
    })

    workerUser = await prisma.user.create({
      data: {
        loginId: 'test_todo_worker1',
        password: hashPassword('workerpass123'),
        firstName: '一朗',
        lastName: '作業',
        role: 'worker',
        isActive: true,
        requirePasswordReset: false,
        assignedSites: { connect: [{ id: testSiteId }] },
      },
    })
    await prisma.userOnSite.create({
      data: { userId: workerUser.id, siteId: testSiteId, role: 'worker' },
    })

    otherWorkerUser = await prisma.user.create({
      data: {
        loginId: 'test_todo_worker2',
        password: hashPassword('workerpass123'),
        firstName: '二朗',
        lastName: '作業',
        role: 'worker',
        isActive: true,
        requirePasswordReset: false,
        assignedSites: { connect: [{ id: testSiteId }] },
      },
    })
    await prisma.userOnSite.create({
      data: { userId: otherWorkerUser.id, siteId: testSiteId, role: 'worker' },
    })

    viewerUser = await prisma.user.create({
      data: {
        loginId: 'test_todo_viewer',
        password: hashPassword('viewerpass123'),
        firstName: '三朗',
        lastName: '閲覧',
        role: 'worker',
        isActive: true,
        requirePasswordReset: false,
        assignedSites: { connect: [{ id: testSiteId }] },
      },
    })
    await prisma.userOnSite.create({
      data: { userId: viewerUser.id, siteId: testSiteId, role: 'viewer' },
    })
  })

  afterAll(async () => {
    await cleanup()
  })

  it('POST /api/sites/:siteId/todos/sync upserts local todos, respects updatedAt ordering, and processes deletedIds', async () => {
    const t1 = '2026-10-15T01:00:00.000Z'
    const t2 = '2026-10-15T02:00:00.000Z'
    const t0 = '2026-10-15T00:00:00.000Z'

    // 1. Initial sync of two todos
    const res1 = await syncTodosHandler(createTestH3Event({
      method: 'POST',
      user: workerUser,
      params: { siteId: testSiteId },
      body: {
        localTodos: [
          { id: 'todo-sync-1', text: '初期タスク1', completed: false, createdAt: t1, updatedAt: t1 },
          { id: 'todo-sync-2', text: '初期タスク2', completed: false, createdAt: t1, updatedAt: t1 },
        ],
      },
    }))

    expect(res1.success).toBe(true)
    expect(res1.todos).toHaveLength(2)

    // 2. Sync with newer updatedAt for todo-sync-1, older updatedAt for todo-sync-2 (should NOT overwrite), and delete todo-sync-2 via deletedIds
    const res2 = await syncTodosHandler(createTestH3Event({
      method: 'POST',
      user: workerUser,
      params: { siteId: testSiteId },
      body: {
        localTodos: [
          { id: 'todo-sync-1', text: '更新後タスク1', completed: true, createdAt: t1, updatedAt: t2 },
          { id: 'todo-sync-2', text: '復活しないタスク2', completed: false, createdAt: t1, updatedAt: t0 },
        ],
        deletedIds: ['todo-sync-2'],
      },
    }))

    expect(res2.todos).toHaveLength(1)
    expect(res2.todos[0].id).toBe('todo-sync-1')
    expect(res2.todos[0].text).toBe('更新後タスク1')
    expect(res2.todos[0].completed).toBe(true)
  })

  it('prevents cross-user tampering on sync, PUT, and DELETE', async () => {
    // otherWorkerUser tries to overwrite or delete workerUser's todo-sync-1 via sync
    await syncTodosHandler(createTestH3Event({
      method: 'POST',
      user: otherWorkerUser,
      params: { siteId: testSiteId },
      body: {
        localTodos: [
          {
            id: 'todo-sync-1',
            text: '他人のタスク乗っ取り試行',
            completed: false,
            updatedAt: '2026-10-15T09:00:00.000Z',
          },
        ],
        deletedIds: ['todo-sync-1'],
      },
    }))

    // Verify workerUser's todo-sync-1 is untouched
    const workerTodos = await prisma.todo.findMany({
      where: { siteId: testSiteId, userId: { in: [workerUser.id, workerUser.loginId] } },
    })

    expect(workerTodos).toHaveLength(1)
    expect(workerTodos[0].text).toBe('更新後タスク1')

    // otherWorkerUser tries PUT /api/sites/:siteId/todos/todo-sync-1 -> 404 SYS_NOT_FOUND
    await expect(updateTodoHandler(createTestH3Event({
      method: 'PUT',
      user: otherWorkerUser,
      params: { siteId: testSiteId, id: 'todo-sync-1' },
      body: { text: '不正更新' },
    }))).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: ErrorCode.SYS_NOT_FOUND,
    })

    // otherWorkerUser tries DELETE /api/sites/:siteId/todos/todo-sync-1 -> does not delete workerUser's todo
    await deleteTodoHandler(createTestH3Event({
      method: 'DELETE',
      user: otherWorkerUser,
      params: { siteId: testSiteId, id: 'todo-sync-1' },
    }))
    const stillExists = await prisma.todo.findUnique({ where: { id: 'todo-sync-1' } })

    expect(stillExists).not.toBeNull()
  })

  it('blocks viewer role from mutating Todos (sync, PUT, DELETE)', async () => {
    // Viewer cannot POST sync -> 403 AUTH_FORBIDDEN_ROLE
    await expect(syncTodosHandler(createTestH3Event({
      method: 'POST',
      user: viewerUser,
      params: { siteId: testSiteId },
      body: { localTodos: [{ id: 'todo-v-1', text: '閲覧者追加', completed: false }] },
    }))).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: ErrorCode.AUTH_FORBIDDEN_ACTION,
    })

    // Viewer cannot PUT -> 403 AUTH_FORBIDDEN_ROLE
    await expect(updateTodoHandler(createTestH3Event({
      method: 'PUT',
      user: viewerUser,
      params: { siteId: testSiteId, id: 'todo-sync-1' },
      body: { completed: false },
    }))).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: ErrorCode.AUTH_FORBIDDEN_ACTION,
    })

    // Viewer cannot DELETE -> 403 AUTH_FORBIDDEN_ROLE
    await expect(deleteTodoHandler(createTestH3Event({
      method: 'DELETE',
      user: viewerUser,
      params: { siteId: testSiteId, id: 'todo-sync-1' },
    }))).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: ErrorCode.AUTH_FORBIDDEN_ACTION,
    })
  })
})
