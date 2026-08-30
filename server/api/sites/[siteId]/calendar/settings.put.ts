import { defineEventHandler, readBody, getRouterParam } from "h3";
import { prisma } from "../../../../utils/prisma";
import { requireAdminUser } from "../../../../utils/auth";

export default defineEventHandler(async (event) => {
  await requireAdminUser(event);

  const siteId = getRouterParam(event, "siteId");
  if (!siteId) return null;

  const body = await readBody(event);

  const updated = await prisma.calendarSettings.upsert({
    where: { siteId },
    update: {
      eventTypes: JSON.stringify(body.eventTypes || []),
      holidayDays: JSON.stringify(body.holidayDays || []),
      customHolidays: JSON.stringify(body.customHolidays || [])
    },
    create: {
      siteId,
      eventTypes: JSON.stringify(body.eventTypes || []),
      holidayDays: JSON.stringify(body.holidayDays || []),
      customHolidays: JSON.stringify(body.customHolidays || [])
    }
  });

  return {
    siteId: updated.siteId,
    eventTypes: JSON.parse(updated.eventTypes),
    holidayDays: JSON.parse(updated.holidayDays),
    customHolidays: JSON.parse(updated.customHolidays)
  };
});
