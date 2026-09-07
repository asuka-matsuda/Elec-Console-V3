import { createError, defineEventHandler, getRouterParam } from 'h3'

import { canAccessSite, requireAuthUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'イベントIDが指定されていません。',
    })
  }

  const existingEvent = await prisma.event.findUnique({
    where: { id },
  })

  if (!existingEvent) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: '指定されたイベントが見つかりません。',
    })
  }

  // 現場アクセス認可チェック
  if (!canAccessSite(user, existingEvent.siteId)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'この現場のイベントを削除する権限がありません。',
    })
  }

  try {
    await prisma.event.delete({
      where: { id },
    })

    return { success: true }
  }
  catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    console.error('API Error in [id].delete.ts:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'イベントの削除に失敗しました。',
    })
  }
})
