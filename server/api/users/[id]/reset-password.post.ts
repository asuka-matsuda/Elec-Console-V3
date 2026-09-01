import { createError, defineEventHandler, getRouterParam } from 'h3'

import { requireAdminUser } from '../../../utils/auth'
import { hashPassword } from '../../../utils/password'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })

  const user = await prisma.user.findUnique({ where: { id } })

  if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  await prisma.user.update({
    where: { id },
    data: {
      password: hashPassword(user.loginId),
      requirePasswordReset: true,
    },
  })

  return { success: true }
})
