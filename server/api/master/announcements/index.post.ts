/**
 * マスターお知らせ新規作成 API
 * POST /api/master/announcements
 *
 * @description 新しいシステムお知らせを作成・登録します。
 * @permission システム管理者限定
 */

import { defineEventHandler, readBody } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireMasterUser } from '../../../utils/auth'
import { createAppError } from '../../../utils/error'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireMasterUser(event)
  const body = await readBody<{ title?: string, date?: string, desc?: string }>(event).catch(() => null)

  if (!body?.title?.trim() || !body?.date?.trim()) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
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
