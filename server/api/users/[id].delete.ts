/**
 * ユーザー削除 API
 * DELETE /api/users/:id
 *
 * @description 指定されたユーザーアカウントを削除します。
 * @permission マスター管理者限定
 */

import { defineEventHandler, getRouterParam } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireMasterUser } from '../../utils/auth'
import { createAppError } from '../../utils/error'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const authUser = await requireMasterUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: 'ユーザーIDが指定されていません。',
    })
  }

  const targetUser = await prisma.user.findUnique({ where: { id } })

  if (!targetUser) {
    throw createAppError({
      code: ErrorCode.USER_NOT_FOUND,
      message: 'ユーザーが見つかりません。',
    })
  }

  // master アカウントの削除禁止
  if (targetUser.loginId === 'master') {
    throw createAppError({
      code: ErrorCode.USER_MASTER_PROTECTED,
      message: 'マスター管理者を削除することはできません。',
    })
  }

  // 自身のアカウント削除禁止
  if (targetUser.id === authUser.id) {
    throw createAppError({
      code: ErrorCode.USER_SELF_DEMOTION_DENIED,
      message: '自分自身のアカウントを削除することはできません。',
    })
  }

  await prisma.$transaction([
    prisma.todo.deleteMany({
      where: {
        OR: [
          { userId: targetUser.loginId },
          { userId: targetUser.id },
        ],
      },
    }),
    prisma.user.delete({ where: { id } }),
  ])

  return { success: true }
})
