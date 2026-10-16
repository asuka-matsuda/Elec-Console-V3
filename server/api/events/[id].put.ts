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
import { getUserDisplayName } from '#shared/utils/user'

import { requireAuthUser, requireSiteRole } from '../../utils/auth'
import { createAppError } from '../../utils/error'
import { parseEventAssignees, serializeEventAssignees } from '../../utils/jsonFields'
import { prisma } from '../../utils/prisma'
import { validateRequestBody } from '../../utils/validation'

const UpdateEventSchema = z.object({
  siteId: z.string().trim().nullable().optional(),
  title: z.string().trim().min(1, '予定タイトルを入力してください。').optional(),
  start: z.string().trim().min(1, '開始日時を指定してください。').optional(),
  end: z.string().nullable().optional(),
  allDay: z.boolean().optional(),
  type: z.string().optional(),
  isMilestone: z.boolean().optional(),
  isPersonal: z.boolean().optional(),
  location: z.string().trim().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  assignees: z.array(z.string()).optional(),
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

  const body = await validateRequestBody(event, UpdateEventSchema)
  const nextIsPersonal = body.isPersonal ?? Boolean(existingEvent.isPersonal)

  // 既存が個人予定の場合は所有者本人のみ編集可能
  const user = existingEvent.isPersonal
    ? await requireAuthUser(event)
    : await requireSiteRole(event, ['admin', 'worker'], existingEvent.siteId || body.siteId || '')

  if (existingEvent.isPersonal && existingEvent.userId !== user.id) {
    throw createAppError({
      code: ErrorCode.AUTH_FORBIDDEN_ACTION,
      message: '他のユーザーの個人予定は変更できません。',
    })
  }

  // 個人予定から現場共有予定へ切り替える場合は対象現場の編集権限を検証
  const resolvedSiteId = nextIsPersonal ? null : (existingEvent.siteId || body.siteId || null)

  if (!nextIsPersonal) {
    if (!resolvedSiteId) {
      throw createAppError({
        code: ErrorCode.SYS_VALIDATION_FAILED,
        message: '共有予定の現場IDが指定されていません。',
      })
    }
    if (existingEvent.isPersonal) {
      await requireSiteRole(event, ['admin', 'worker'], resolvedSiteId)
    }
  }

  const actorName = getUserDisplayName(user)
  const existingIsMilestone = Boolean(existingEvent.isMilestone || existingEvent.type === 'milestone')
  const isMilestone = body.isMilestone ?? existingIsMilestone
  const nextStart = body.start ?? existingEvent.start
  const normalizedStart = isMilestone ? (nextStart.split('T')[0] || nextStart) : nextStart
  const normalizedEnd = isMilestone
    ? null
    : (body.end !== undefined ? (body.end || null) : existingEvent.end)

  if (!isMilestone && normalizedEnd && normalizedStart > normalizedEnd) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: '終了日時は開始日時以降を指定してください。',
    })
  }

  const nextType = isMilestone
    ? 'milestone'
    : (body.type && body.type !== 'milestone'
        ? body.type
        : (existingEvent.type !== 'milestone' ? existingEvent.type : 'work'))

  const updated = await prisma.event.update({
    where: { id },
    data: {
      siteId: resolvedSiteId,
      userId: nextIsPersonal ? user.id : (existingEvent.userId || user.id),
      isPersonal: nextIsPersonal,
      title: body.title ?? existingEvent.title,
      start: normalizedStart,
      end: normalizedEnd,
      allDay: isMilestone ? true : (body.allDay ?? existingEvent.allDay),
      type: nextType,
      isMilestone,
      location: body.location !== undefined ? (body.location || null) : existingEvent.location,
      description: body.description !== undefined ? (body.description || null) : existingEvent.description,
      assignees: nextIsPersonal
        ? null
        : (body.assignees !== undefined ? serializeEventAssignees(body.assignees) : existingEvent.assignees),
      updatedBy: actorName,
    },
  })

  return {
    ...updated,
    isPersonal: nextIsPersonal,
    assignees: parseEventAssignees(updated.assignees),
    isMilestone,
  }
})
