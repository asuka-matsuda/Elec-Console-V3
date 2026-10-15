/**
 * カレンダーイベント更新 API
 * PUT /api/events/:id
 *
 * @description 指定された予定イベントのタイトル、日時、種別、備考等を更新します。
 * @permission 現場アクセス権限
 */

import { defineEventHandler, getRouterParam } from 'h3'
import { z } from 'zod'

import { ErrorCode } from '#shared/types/errors'

import { requireSiteRole } from '../../utils/auth'
import { createAppError } from '../../utils/error'
import { prisma } from '../../utils/prisma'
import { validateRequestBody } from '../../utils/validation'

const UpdateEventSchema = z.object({
  title: z.string().trim().min(1, '予定タイトルを入力してください。').optional(),
  start: z.string().trim().min(1, '開始日時を指定してください。').optional(),
  end: z.string().nullable().optional(),
  allDay: z.boolean().optional(),
  type: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: 'イベントIDが指定されていません。',
    })
  }

  const existingEvent = await prisma.event.findUnique({
    where: { id },
  })

  if (!existingEvent) {
    throw createAppError({
      code: ErrorCode.SYS_NOT_FOUND,
      message: '指定されたイベントが見つかりません。',
    })
  }

  // 現場アクセス権・ロール（admin / worker）および現場有効状態を検証
  await requireSiteRole(event, ['admin', 'worker'], existingEvent.siteId)

  const body = await validateRequestBody(event, UpdateEventSchema)

  return prisma.event.update({
    where: { id },
    data: {
      title: body.title ?? existingEvent.title,
      start: body.start ?? existingEvent.start,
      end: body.end !== undefined ? (body.end || null) : existingEvent.end,
      allDay: body.allDay ?? existingEvent.allDay,
      type: body.type ?? existingEvent.type,
    },
  })
})
