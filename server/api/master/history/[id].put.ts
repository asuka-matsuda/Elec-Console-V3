/**
 * マスター更新履歴更新 API
 * PUT /api/master/history/:id
 *
 * @description 既存の更新履歴項目の内容を更新します。
 * @permission システム管理者限定
 */

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

  const body = await readBody<{ version?: string, title?: string, date?: string, desc?: string, status?: string }>(event)

  if (!body?.version?.trim() || !body?.title?.trim() || !body?.date?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'バージョン、タイトル、日付は必須です。',
    })
  }

  const existing = await prisma.history.findUnique({
    where: { id },
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: '指定された更新履歴が見つかりません。',
    })
  }

  return await prisma.history.update({
    where: { id },
    data: {
      version: body.version.trim(),
      title: body.title.trim(),
      date: body.date.trim(),
      desc: body.desc?.trim() || '',
      status: body.status?.trim() || 'neutral',
    },
  })
})
