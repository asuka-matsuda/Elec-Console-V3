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

  await prisma.announcement.delete({
    where: { id },
  })

  return { success: true }
})
