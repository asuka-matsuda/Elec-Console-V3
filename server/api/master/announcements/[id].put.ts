import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'

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

  const body = await readBody<{ title?: string, date?: string, desc?: string }>(event)

  if (!body?.title?.trim() || !body?.date?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'タイトルと日付は必須です。',
    })
  }

  const existing = await prisma.announcement.findUnique({
    where: { id },
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: '指定されたお知らせが見つかりません。',
    })
  }

  return await prisma.announcement.update({
    where: { id },
    data: {
      title: body.title.trim(),
      date: body.date.trim(),
      desc: body.desc?.trim() || '',
    },
  })
})
