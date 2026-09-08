import { defineEventHandler, getRouterParam } from 'h3'

import { requireSiteAccess } from '../../../../utils/auth'
import { prisma } from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireSiteAccess(event)

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) return null

  const setting = await prisma.calendarSettings.findUnique({
    where: { siteId },
  })

  if (setting) {
    const parsedTypes = JSON.parse(setting.eventTypes || '[]')
    // 旧 colorVar があれば HEX に変換
    const colorVarMap: Record<string, string> = {
      'category-main': '#2f81f7',
      'status-warning': '#d29922',
      'category-database': '#58a6ff',
      'text-muted': '#8b949e',
      'status-danger': '#f85149',
      'status-success': '#3fb950',
    }
    const normalizedTypes = parsedTypes.map((t: { id: string, name: string, color?: string, colorVar?: string }) => ({
      id: t.id,
      name: t.name,
      color: t.color || (t.colorVar ? colorVarMap[t.colorVar] || '#2f81f7' : '#2f81f7'),
    }))

    return {
      siteId: setting.siteId,
      eventTypes: normalizedTypes,
      holidayDays: JSON.parse(setting.holidayDays || '[]'),
      customHolidays: JSON.parse(setting.customHolidays || '[]'),
    }
  }

  return {
    siteId,
    eventTypes: [
      { id: 'meeting', name: '会議', color: '#2f81f7' },
      { id: 'test', name: '送電試験', color: '#d29922' },
      { id: 'construction', name: '工事', color: '#39c5cf' },
      { id: 'other', name: 'その他', color: '#8b949e' },
    ],
    holidayDays: [0, 6],
    customHolidays: [],
  }
})
