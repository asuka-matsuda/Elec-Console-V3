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

  const mappedSites = sites.map((site) => {
    let parsedExcluded: string[] = []

    if (site.settings?.excludedCircuits) {
      try {
        parsedExcluded = JSON.parse(site.settings.excludedCircuits)
      }
      catch {
        parsedExcluded = []
      }
    }

    return {
      ...site,
      excelPath: site.settings?.excelPath || undefined,
      excludedCircuits: parsedExcluded,
    }
  })

  return { sites: mappedSites, siteSettings }
})
