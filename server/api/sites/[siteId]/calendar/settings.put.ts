import { defineEventHandler, getRouterParam, readBody } from 'h3'

import { requireSiteAccess } from '../../../../utils/auth'
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
  await requireSiteAccess(event)

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) return null

  const body = await readBody(event)

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
