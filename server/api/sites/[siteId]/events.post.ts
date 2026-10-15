/**
 * 現場カレンダー予定作成 API
 * POST /api/sites/:siteId/events
 *
 * @description 指定現場に新しいカレンダー予定を作成・登録します。
 * @permission 現場アクセス権限
 */

import { defineEventHandler, getRouterParam } from 'h3'
import { z } from 'zod'

import { ErrorCode } from '#shared/types/errors'

import { requireSiteRole } from '../../../utils/auth'
import { createAppError } from '../../../utils/error'
import { prisma } from '../../../utils/prisma'
import { validateRequestBody } from '../../../utils/validation'

const CreateEventSchema = z.object({
  title: z.string().trim().min(1, '予定タイトルを入力してください。'),
  start: z.string().trim().min(1, '開始日時を指定してください。'),
  end: z.string().nullable().optional(),
  allDay: z.boolean().optional(),
  type: z.string().optional(),
  isMilestone: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  await requireSiteRole(event, ['admin', 'worker'])

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: '現場IDが指定されていません。',
    })
  }

  const body = await validateRequestBody(event, CreateEventSchema)
  const isMilestone = Boolean(body.isMilestone || body.type === 'milestone')

  const created = await prisma.event.create({
    data: {
      siteId,
      title: body.title,
      start: isMilestone ? (body.start.split('T')[0] || body.start) : body.start,
      end: isMilestone ? null : (body.end || null),
      allDay: isMilestone ? true : (body.allDay || false),
      type: isMilestone ? 'milestone' : (body.type || 'other'),
    },
  })

  if (isMilestone) {
    await prisma.$executeRaw`UPDATE "Event" SET "isMilestone" = 1 WHERE "id" = ${created.id}`
  }

  return {
    ...created,
    isMilestone,
  }
})
