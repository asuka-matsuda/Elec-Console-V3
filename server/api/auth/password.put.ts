import { createError, defineEventHandler, readBody } from 'h3'

import { requireAuthUser } from '../../utils/auth'
import { hashPassword, verifyPassword } from '../../utils/password'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuthUser(event)
  const body = await readBody(event)
  const { currentPassword, newPassword } = body || {}

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: '新しいパスワードは8文字以上で設定してください。',
    })
  }

  const user = await prisma.user.findUnique({ where: { id: authUser.id } })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
      message: 'ユーザーが見つかりません。',
    })
  }

  // 初回強制リセット（requirePasswordReset === true）以外の通常パスワード変更時は、現在のパスワード入力を必須化して厳格検証
  if (!user.requirePasswordReset) {
    if (!currentPassword || typeof currentPassword !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: '現在のパスワードを入力してください。',
      })
    }

    if (!verifyPassword(currentPassword, user.password)) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: '現在のパスワードが間違っています。',
      })
    }

    if (currentPassword === newPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: '現在のパスワードとは異なるパスワードを設定してください。',
      })
    }
  }

  const hashedPassword = hashPassword(newPassword)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      requirePasswordReset: false,
    },
  })

  return { success: true }
})
