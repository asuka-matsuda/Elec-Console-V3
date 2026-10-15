/**
 * マスターお知らせ削除 API
 * DELETE /api/master/announcements/:id
 *
 * @description 指定されたシステムお知らせを削除します。
 * @permission システム管理者限定
 */

import { defineEventHandler, getRouterParam } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireMasterUser } from '../../../utils/auth'
import { createAppError } from '../../../utils/error'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireMasterUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: 'IDが指定されていません。',
    })
  }

  const existing = await prisma.announcement.findUnique({
    where: { id },
  })

  if (!existing) {
    throw createAppError({
      code: ErrorCode.SYS_NOT_FOUND,
      message: '指定されたお知らせが見つかりません。',
    })
  }

  await prisma.announcement.delete({
    where: { id },
  })

  return { success: true }
})
