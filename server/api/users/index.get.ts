import { defineEventHandler } from 'h3'

import { requireAdminUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const users = await prisma.user.findMany({
    include: { assignedSites: true },
  })

  return users.map((user) => {
    const assignedSiteIds = user.assignedSites.map(s => s.id)
    const { password: _dbPassword, assignedSites: _assignedSites, ...restUser } = user

    return { ...restUser, assignedSiteIds }
  })
})
