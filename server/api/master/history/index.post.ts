/**
 * マスター更新履歴新規作成 API
 * POST /api/master/history
 *
 * @description 新しい更新履歴項目（バージョン、タイトル、概要）を作成・登録します。
 * @permission システム管理者限定
 */

import { defineEventHandler, readBody } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireMasterUser } from '../../../utils/auth'
import { createAppError } from '../../../utils/error'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireMasterUser(event)
  const body = await readBody<{ version?: string, title?: string, date?: string, desc?: string, status?: string, toolId?: string }>(event).catch(() => null)

  if (!body?.version?.trim() || !body?.title?.trim() || !body?.date?.trim()) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
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
      toolId: body.toolId?.trim() || null,
    },
  })
})
