import { createError, defineEventHandler, getRouterParam } from 'h3'

import { requireAdminUser } from '../../../utils/auth'
import { generateRandomPassword, hashPassword } from '../../../utils/password'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'ユーザーIDが指定されていません。',
    })
  }

  const user = await prisma.user.findUnique({ where: { id } })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'ユーザーが見つかりません。',
    })
  }

  // 推測容易な loginId ではなく、安全なランダム初期パスワードを発行
  const initialPassword = generateRandomPassword(10)

  await prisma.user.update({
    where: { id },
    data: {
      password: hashPassword(initialPassword),
      requirePasswordReset: true,
    },
  })

  return {
    success: true,
    initialPassword,
  }
})
