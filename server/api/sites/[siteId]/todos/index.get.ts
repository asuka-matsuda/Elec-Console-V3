/**
 * 現場パーソナルToDo一覧取得 API
 * GET /api/sites/:siteId/todos
 */

import { createError, defineEventHandler, getRouterParam } from 'h3'

import { requireSiteAccess } from '../../../../utils/auth'
import { prisma } from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireSiteAccess(event)
  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createError({
      statusCode: 400,
      message: '現場IDが指定されていません',
    })
  }

  const todos = await prisma.todo.findMany({
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
    todos: todos.map(t => ({
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
