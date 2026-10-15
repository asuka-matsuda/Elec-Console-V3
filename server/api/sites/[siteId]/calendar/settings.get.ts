/**
 * 現場カレンダー表示設定取得 API
 * GET /api/sites/:siteId/calendar/settings
 *
 * @description 現場カレンダーのイベント種別定義や表示色設定を取得します。
 * @permission 現場アクセス権限
 */

import { defineEventHandler, getRouterParam } from 'h3'

import { DEFAULT_CALENDAR_EVENT_TYPES } from '#shared/types/calendar'
import { ErrorCode } from '#shared/types/errors'

import { requireSiteAccess } from '../../../../utils/auth'
import { createAppError } from '../../../../utils/error'
import { parseCustomHolidays, parseEventTypes, parseHolidayDays } from '../../../../utils/jsonFields'
import { prisma } from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireSiteAccess(event)

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: '現場IDが指定されていません',
    })
  }

  const setting = await prisma.calendarSettings.findUnique({
    where: { siteId },
  })

  if (setting) {
    const parsedTypes = parseEventTypes(setting.eventTypes)

    return {
      siteId: setting.siteId,
      eventTypes: parsedTypes.length > 0 ? parsedTypes : DEFAULT_CALENDAR_EVENT_TYPES,
      holidayDays: parseHolidayDays(setting.holidayDays),
      customHolidays: parseCustomHolidays(setting.customHolidays),
    }
  }

  return {
    siteId,
    eventTypes: DEFAULT_CALENDAR_EVENT_TYPES,
    holidayDays: [0, 6],
    customHolidays: [],
  }
})
