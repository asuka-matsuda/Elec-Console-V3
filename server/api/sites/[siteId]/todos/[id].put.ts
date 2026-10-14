/**
 * 現場パーソナルToDo更新 API
 * PUT /api/sites/:siteId/todos/:id
 */

import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'

import { requireSiteAccess } from '../../../../utils/auth'
import { prisma } from '../../../../utils/prisma'

interface UpdateTodoBody {
  text?: string
  completed?: boolean
}

export default defineEventHandler(async (event) => {
  const user = await requireSiteAccess(event)
  const siteId = getRouterParam(event, 'siteId')
  const id = getRouterParam(event, 'id')

  if (!siteId || !id) {
    throw createError({
      statusCode: 400,
      message: 'パラメータが不足しています',
    })
  }

  const todo = await prisma.todo.findUnique({
    where: { id },
  })

  if (!todo || todo.siteId !== siteId || todo.userId !== user.loginId) {
    throw createError({
      statusCode: 404,
      message: '対象のタスクが見つかりません',
    })
  }

  const body = await readBody<UpdateTodoBody>(event)

  const updated = await prisma.todo.update({
    where: { id },
    data: {
      ...(body.text !== undefined ? { text: body.text } : {}),
      ...(body.completed !== undefined ? { completed: Boolean(body.completed) } : {}),
    },
  })

  return {
    success: true,
    todo: {
      id: updated.id,
      siteId: updated.siteId,
      userId: updated.userId,
      text: updated.text,
      completed: updated.completed,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  }
})
