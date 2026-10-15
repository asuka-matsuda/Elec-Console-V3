/**
 * 現場パーソナルToDo削除 API
 * DELETE /api/sites/:siteId/todos/:id
 */

import { defineEventHandler, getRouterParam } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireSiteRole } from '../../../../utils/auth'
import { createAppError } from '../../../../utils/error'
import { prisma } from '../../../../utils/prisma'

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

  // 自分のタスクのみ削除可能
  const todo = await prisma.todo.findUnique({
    where: { id },
  })

  if (todo && todo.siteId === siteId && userKeys.includes(todo.userId)) {
    await prisma.todo.delete({
      where: { id },
    })
  }

  return { success: true }
})
