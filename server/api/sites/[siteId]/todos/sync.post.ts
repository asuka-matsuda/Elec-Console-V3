/**
 * 現場パーソナルToDo同期 ＆ マイグレーション API
 * POST /api/sites/:siteId/todos/sync
 *
 * @description クライアントローカル（IndexedDB）のToDoをサーバーDBへ安全にアップロード・同期し、
 * サーバー上の最新完全リストを返却します。
 */

import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'

import { requireSiteAccess } from '../../../../utils/auth'
import { prisma } from '../../../../utils/prisma'

interface SyncRequestBody {
  localTodos?: Array<{
    id: string
    text: string
    completed: boolean
    createdAt?: string
    updatedAt?: string
  }>
}

export default defineEventHandler(async (event) => {
  const user = await requireSiteAccess(event)
  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createError({
      statusCode: 400,
      message: '現場IDが指定されていません',
    })
  }

  const body = await readBody<SyncRequestBody>(event)
  const localTodos = body?.localTodos || []

  // 1. ローカルから送られてきたToDoをサーバーDBへUpsert
  for (const item of localTodos) {
    if (!item.id || !item.text) continue

    const createdAt = item.createdAt ? new Date(item.createdAt) : new Date()
    const updatedAt = item.updatedAt ? new Date(item.updatedAt) : new Date()

    const existing = await prisma.todo.findUnique({
      where: { id: item.id },
    })

    if (!existing) {
      await prisma.todo.create({
        data: {
          id: item.id,
          siteId,
          userId: user.loginId,
          text: item.text,
          completed: Boolean(item.completed),
          createdAt,
          updatedAt,
        },
      })
    }
    else if (existing.userId === user.loginId && existing.siteId === siteId) {
      // 既存レコードがある場合、ローカルの方が新しければ更新
      if (updatedAt > existing.updatedAt) {
        await prisma.todo.update({
          where: { id: item.id },
          data: {
            text: item.text,
            completed: Boolean(item.completed),
            updatedAt,
          },
        })
      }
    }
  }

  // 2. サーバーDBの最新ToDo一覧を取得して返却
  const allTodos = await prisma.todo.findMany({
    where: {
      siteId,
      userId: user.loginId,
    },
    orderBy: [
      { completed: 'asc' },
      { createdAt: 'desc' },
    ],
  })

  return {
    success: true,
    todos: allTodos.map(t => ({
      id: t.id,
      siteId: t.siteId,
      userId: t.userId,
      text: t.text,
      completed: t.completed,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
  }
})
