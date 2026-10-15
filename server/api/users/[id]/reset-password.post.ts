/**
 * ユーザーパスワード初期化 API
 * POST /api/users/:id/reset-password
 *
 * @description 管理者操作により対象ユーザーの一時パスワードを再発行し、次回ログイン時の変更を義務付けます。
 * @permission マスター管理者限定
 */

import { defineEventHandler, getRouterParam } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireMasterUser } from '../../../utils/auth'
import { createAppError } from '../../../utils/error'
import { generateRandomPassword, hashPassword } from '../../../utils/password'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireMasterUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: 'ユーザーIDが指定されていません。',
    })
  }

  const user = await prisma.user.findUnique({ where: { id } })

  if (!user) {
    throw createAppError({
      code: ErrorCode.USER_NOT_FOUND,
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
