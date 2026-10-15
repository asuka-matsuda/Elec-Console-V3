/**
 * 現場カレンダー表示設定更新 API
 * PUT /api/sites/:siteId/calendar/settings
 *
 * @description 現場カレンダーのイベント種別定義やカスタム設定を保存・更新します。
 * @permission 現場アクセス権限
 */

import { defineEventHandler, getRouterParam, readBody } from 'h3'

import { DEFAULT_CALENDAR_EVENT_TYPES } from '#shared/types/calendar'
import { ErrorCode } from '#shared/types/errors'

import { requireSiteAdmin, requireSiteRole } from '../../../../utils/auth'
import { createAppError } from '../../../../utils/error'
import {
  parseCustomHolidayLabels,
  parseCustomHolidays,
  parseEventTypes,
  parseHolidayDays,
  serializeCustomHolidays,
  serializeEventTypes,
  serializeHolidayDays,
} from '../../../../utils/jsonFields'
import { prisma } from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: '現場IDが指定されていません',
    })
  }

  const body = (await readBody(event).catch(() => ({}))) || {}

  // 休日設定（holidayDays / customHolidays / customHolidayLabels）の変更は現場管理者（admin / master）のみ許可
  if (
    body.holidayDays !== undefined
    || body.customHolidays !== undefined
    || body.customHolidayLabels !== undefined
  ) {
    await requireSiteAdmin(event, siteId)
  }
  else {
    await requireSiteRole(event, ['admin', 'worker'], siteId)
  }

  const updateData: {
    eventTypes?: string
    holidayDays?: string
    customHolidays?: string
  } = {}

  if (body.eventTypes !== undefined) {
    updateData.eventTypes = serializeEventTypes(body.eventTypes)
  }
  if (body.holidayDays !== undefined) {
    updateData.holidayDays = serializeHolidayDays(body.holidayDays)
  }
  if (body.customHolidays !== undefined) {
    updateData.customHolidays = serializeCustomHolidays(body.customHolidays, body.customHolidayLabels)
  }

  const updated = await prisma.calendarSettings.upsert({
    where: { siteId },
    update: updateData,
    create: {
      siteId,
      eventTypes: updateData.eventTypes ?? serializeEventTypes(DEFAULT_CALENDAR_EVENT_TYPES),
      holidayDays: updateData.holidayDays ?? serializeHolidayDays([0, 6]),
      customHolidays: updateData.customHolidays ?? serializeCustomHolidays([]),
    },
  })

  const parsedTypes = parseEventTypes(updated.eventTypes)

  return {
    siteId: updated.siteId,
    eventTypes: parsedTypes.length > 0 ? parsedTypes : DEFAULT_CALENDAR_EVENT_TYPES,
    holidayDays: parseHolidayDays(updated.holidayDays),
    customHolidays: parseCustomHolidays(updated.customHolidays),
    customHolidayLabels: parseCustomHolidayLabels(updated.customHolidays),
  }
})
