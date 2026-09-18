import { createError, defineEventHandler, readBody } from 'h3'

import { requireMasterUser } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireMasterUser(event)
  const body = await readBody<{ version?: string, title?: string, date?: string, desc?: string, status?: string }>(event)

  if (!body?.version?.trim() || !body?.title?.trim() || !body?.date?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'バージョン、タイトル、日付は必須です。',
    })
  }

  return await prisma.history.create({
    data: {
      version: body.version.trim(),
      title: body.title.trim(),
      date: body.date.trim(),
      desc: body.desc?.trim() || '',
      status: body.status?.trim() || 'neutral',
    },
  })
})
