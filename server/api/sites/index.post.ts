/**
 * 現場新規登録 API
 * POST /api/sites
 *
 * @description 新規現場を作成・登録します。
 * @permission システム管理者限定
 */

import { createError, defineEventHandler, readBody } from 'h3'

import { requireAdminUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const body = await readBody(event)

  const id = typeof body.id === 'string' ? body.id.trim() : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '現場IDを入力してください。',
    })
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw createError({
      statusCode: 400,
      message: '現場IDは半角英数字、ハイフン（-）、アンダースコア（_）のみ使用できます。',
    })
  }

  if (!name) {
    throw createError({
      statusCode: 400,
      message: '現場名を入力してください。',
    })
  }

  const existing = await prisma.site.findUnique({
    where: { id },
  })

  if (existing) {
    throw createError({
      statusCode: 409,
      message: `現場ID「${id}」は既に使用されています。別のIDを指定してください。`,
    })
  }

  const newSite = await prisma.site.create({
    data: {
      id,
      name,
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
