/**
 * 現場カレンダー表示設定更新 API
 * PUT /api/sites/:siteId/calendar/settings
 *
 * @description 現場カレンダーのイベント種別定義やカスタム設定を保存・更新します。
 * @permission 現場アクセス権限
 */

import { defineEventHandler, getRouterParam, readBody } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireSiteAdmin } from '../../../../utils/auth'
import { createAppError } from '../../../../utils/error'
import {
  parseCustomHolidays,
  parseEventTypes,
  parseHolidayDays,
  serializeCustomHolidays,
  serializeEventTypes,
  serializeHolidayDays,
} from '../../../../utils/jsonFields'
import { prisma } from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireSiteAdmin(event)

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: '現場IDが指定されていません',
    })
  }

  const body = (await readBody(event).catch(() => ({}))) || {}

  const eventTypesSerialized = serializeEventTypes(body.eventTypes)
  const holidayDaysSerialized = serializeHolidayDays(body.holidayDays)
  const customHolidaysSerialized = serializeCustomHolidays(body.customHolidays)

  const updated = await prisma.calendarSettings.upsert({
    where: { siteId },
    update: {
      eventTypes: eventTypesSerialized,
      holidayDays: holidayDaysSerialized,
      customHolidays: customHolidaysSerialized,
    },
    create: {
      siteId,
      eventTypes: eventTypesSerialized,
      holidayDays: holidayDaysSerialized,
      customHolidays: customHolidaysSerialized,
    },
  })

  return {
    siteId: updated.siteId,
    eventTypes: parseEventTypes(updated.eventTypes),
    holidayDays: parseHolidayDays(updated.holidayDays),
    customHolidays: parseCustomHolidays(updated.customHolidays),
  }
})
