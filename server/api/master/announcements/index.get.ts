import { defineEventHandler } from 'h3'

import { requireMasterUser } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireMasterUser(event)

  return await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
  })
})
