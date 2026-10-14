/**
 * 現場パーソナルToDo削除 API
 * DELETE /api/sites/:siteId/todos/:id
 */

import { createError, defineEventHandler, getRouterParam } from 'h3'

import { requireSiteAccess } from '../../../../utils/auth'
import { prisma } from '../../../../utils/prisma'

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

  // 自分のタスクのみ削除可能
  const todo = await prisma.todo.findUnique({
    where: { id },
  })

  if (todo && todo.siteId === siteId && todo.userId === user.loginId) {
    await prisma.todo.delete({
      where: { id },
    })
  }

  return { success: true }
})
