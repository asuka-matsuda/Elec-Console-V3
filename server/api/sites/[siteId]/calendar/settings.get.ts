import { defineEventHandler, getRouterParam } from "h3";
import { prisma } from "../../../../utils/prisma";

export default defineEventHandler(async (event) => {
  const siteId = getRouterParam(event, "siteId");
  if (!siteId) return null;

  const setting = await prisma.calendarSettings.findUnique({
    where: { siteId }
  });

  if (setting) {
    return {
      siteId: setting.siteId,
      eventTypes: JSON.parse(setting.eventTypes),
      holidayDays: JSON.parse(setting.holidayDays),
      customHolidays: JSON.parse(setting.customHolidays)
    };
  }

  return { 
    siteId, 
    eventTypes: [
      { id: "meeting", name: "会議", colorVar: "category-main" },
      { id: "test", name: "送電試験", colorVar: "status-warning" },
      { id: "construction", name: "工事", colorVar: "category-database" },
      { id: "other", name: "その他", colorVar: "text-muted" }
    ], 
    holidayDays: [0, 6],
    customHolidays: []
  };
});