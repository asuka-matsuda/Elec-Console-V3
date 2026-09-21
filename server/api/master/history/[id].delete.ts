/**
 * マスター更新履歴削除 API
 * DELETE /api/master/history/:id
 *
 * @description 指定された更新履歴項目を削除します。
 * @permission システム管理者限定
 */

import { createError, defineEventHandler, getRouterParam } from 'h3'

import { requireMasterUser } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireMasterUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'IDが指定されていません。',
    })
  }

  await prisma.history.delete({
    where: { id },
  })

  return { success: true }
})
