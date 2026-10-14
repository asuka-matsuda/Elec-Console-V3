import { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

describe('Todos DB & Cascade Operations', () => {
  const prisma = new PrismaClient()
  const testSiteId = 'test-site-todo-01'
  const testUserId = 'test-worker-01'

  const cleanup = async () => {
    try {
      await prisma.site.delete({ where: { id: testSiteId } })
    }
    catch {
      // 存在しない場合は無視
    }
  }

  beforeAll(async () => {
    await cleanup()
    await prisma.site.create({
      data: {
        id: testSiteId,
        name: 'ToDoテスト現場',
        status: 'active',
      },
    })
  })

  afterAll(async () => {
    await cleanup()
    await prisma.$disconnect()
  })

  it('ToDoを作成し、現場とユーザーに紐づいて保存されること', async () => {
    const todo = await prisma.todo.create({
      data: {
        id: 'todo-001',
        siteId: testSiteId,
        userId: testUserId,
        text: '3Fコンセント確認',
        completed: false,
      },
    })

    expect(todo.id).toBe('todo-001')
    expect(todo.siteId).toBe(testSiteId)
    expect(todo.userId).toBe(testUserId)
    expect(todo.text).toBe('3Fコンセント確認')
    expect(todo.completed).toBe(false)
  })

  it('ToDoの完了フラグを更新できること', async () => {
    const updated = await prisma.todo.update({
      where: { id: 'todo-001' },
      data: { completed: true },
    })

    expect(updated.completed).toBe(true)
  })

  it('現場を削除した際に紐づくToDoがカスケード削除されること', async () => {
    await prisma.site.delete({
      where: { id: testSiteId },
    })

    const remaining = await prisma.todo.findMany({
      where: { siteId: testSiteId },
    })

    expect(remaining).toHaveLength(0)
  })
})
