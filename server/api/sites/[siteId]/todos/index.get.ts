/**
 * 現場パーソナルToDo一覧取得 API
 * GET /api/sites/:siteId/todos
 */

import { defineEventHandler, getRouterParam } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireSiteAccess } from '../../../../utils/auth'
import { createAppError } from '../../../../utils/error'
import { prisma } from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireSiteAccess(event)
  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: '現場IDが指定されていません',
    })
  }

  const userKeys = Array.from(new Set([user.id, user.loginId].filter(Boolean)))

  const todos = await prisma.todo.findMany({
    where: {
      siteId,
      userId: { in: userKeys },
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
