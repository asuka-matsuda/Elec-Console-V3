/**
 * 現場パーソナルToDo更新 API
 * PUT /api/sites/:siteId/todos/:id
 */

import { defineEventHandler, getRouterParam, readBody } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireSiteRole } from '../../../../utils/auth'
import { createAppError } from '../../../../utils/error'
import { prisma } from '../../../../utils/prisma'

interface UpdateTodoBody {
  text?: string
  completed?: boolean
}

export default defineEventHandler(async (event) => {
  const user = await requireSiteRole(event, ['admin', 'worker'])
  const siteId = getRouterParam(event, 'siteId')
  const id = getRouterParam(event, 'id')

  if (!siteId || !id) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: 'パラメータが不足しています',
    })
  }

  const userKeys = Array.from(new Set([user.id, user.loginId].filter(Boolean)))

  const todo = await prisma.todo.findUnique({
    where: { id },
  })

  if (!todo || todo.siteId !== siteId || !userKeys.includes(todo.userId)) {
    throw createAppError({
      code: ErrorCode.SYS_NOT_FOUND,
      message: '対象のタスクが見つかりません',
    })
  }

  const body: UpdateTodoBody = (await readBody<UpdateTodoBody>(event).catch(() => null)) || {}

  if (body.text !== undefined && String(body.text).trim().length === 0) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: 'タスク内容を入力してください',
    })
  }

  const updated = await prisma.todo.update({
    where: { id },
    data: {
      ...(body.text !== undefined ? { text: String(body.text).trim() } : {}),
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
