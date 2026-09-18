import { createError, defineEventHandler, readBody } from 'h3'

import { requireMasterUser } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireMasterUser(event)
  const body = await readBody<{ title?: string, date?: string, desc?: string }>(event)

  if (!body?.title?.trim() || !body?.date?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'タイトルと日付は必須です。',
    })
  }

  return await prisma.announcement.create({
    data: {
      title: body.title.trim(),
      date: body.date.trim(),
      desc: body.desc?.trim() || '',
    },
  })
})
