import { defineEventHandler } from 'h3'

import { requireAuthUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAuthUser(event)

  const sites = await prisma.site.findMany({
    include: {
      users: true,
      settings: true,
    },
  })
  const siteSettings = await prisma.siteSettings.findMany()

  return { sites, siteSettings }
})
