import { createError, defineEventHandler, getRouterParam } from 'h3'

import { requireAdminUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const authUser = await requireAdminUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'ユーザーIDが指定されていません。',
    })
  }

  const targetUser = await prisma.user.findUnique({ where: { id } })

  if (!targetUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'ユーザーが見つかりません。',
    })
  }

  // master アカウントの削除禁止
  if (targetUser.loginId === 'master') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'マスター管理者を削除することはできません。',
    })
  }

  // 自身のアカウント削除禁止
  if (targetUser.id === authUser.id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: '自分自身のアカウントを削除することはできません。',
    })
  }

  // 最後の有効な管理者の削除禁止
  if (targetUser.role === 'admin') {
    const adminCount = await prisma.user.count({
      where: { role: 'admin', isActive: true },
    })

    if (adminCount <= 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'システム内に有効な管理者が1人のみのため、削除できません。',
      })
    }
  }

  await prisma.user.delete({ where: { id } })

  return { success: true }
})
