/**
 * 現場カレンダー表示設定取得 API
 * GET /api/sites/:siteId/calendar/settings
 *
 * @description 現場カレンダーのイベント種別定義や表示色設定を取得します。
 * @permission 現場アクセス権限
 */

import { defineEventHandler, getRouterParam } from 'h3'

import { DEFAULT_CALENDAR_EVENT_TYPES } from '#shared/types/calendar'

import { requireSiteAccess } from '../../../../utils/auth'
import { parseCustomHolidays, parseEventTypes, parseHolidayDays } from '../../../../utils/jsonFields'
import { prisma } from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireSiteAccess(event)

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) return null

  const setting = await prisma.calendarSettings.findUnique({
    where: { siteId },
  })

  if (setting) {
    const parsedTypes = parseEventTypes(setting.eventTypes)
    // 旧 colorVar があれば HEX に変換
    const colorVarMap: Record<string, string> = {
      'category-main': '#2f81f7',
      'status-warning': '#d29922',
      'category-database': '#58a6ff',
      'text-muted': '#8b949e',
      'status-danger': '#f85149',
      'status-success': '#3fb950',
    }
    const normalizedTypes = parsedTypes.map((t: { id: string, name?: string, label?: string, color?: string, colorVar?: string }) => ({
      id: t.id,
      name: t.name || t.label || '',
      color: t.color || (t.colorVar ? colorVarMap[t.colorVar] || '#2f81f7' : '#2f81f7'),
    }))

    return {
      siteId: setting.siteId,
      eventTypes: normalizedTypes,
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
