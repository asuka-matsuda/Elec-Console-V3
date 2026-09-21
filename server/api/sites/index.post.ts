/**
 * 現場新規登録 API
 * POST /api/sites
 *
 * @description 新規現場を作成・登録します。
 * @permission システム管理者限定
 */

import { defineEventHandler, readBody } from 'h3'

import { requireAdminUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const body = await readBody(event)

  const newSite = await prisma.site.create({
    data: {
      name: body.name,
      status: body.status || 'planning',
    },
  })

  const settings = await prisma.siteSettings.create({
    data: {
      siteId: newSite.id,
      phase2ThresholdMegOhm: 1.0,
      enablePhase3: true,
    },
  })

  return { site: newSite, settings }
})
