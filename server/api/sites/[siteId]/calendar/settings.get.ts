import { defineEventHandler, getRouterParam } from "h3";
import { prisma } from "../../../../utils/prisma";
import { requireAuthUser } from "../../../../utils/auth";

export default defineEventHandler(async (event) => {
  await requireAuthUser(event);

  const siteId = getRouterParam(event, "siteId");
  if (!siteId) return null;

  const setting = await prisma.calendarSettings.findUnique({
    where: { siteId }
  });

  if (setting) {
    const parsedTypes = JSON.parse(setting.eventTypes || "[]");
    // 旧 colorVar があれば HEX に変換
    const colorVarMap: Record<string, string> = {
      "category-main": "#0ea5e9",
      "status-warning": "#f59e0b",
      "category-database": "#00f0ff",
      "text-muted": "#94a3b8",
      "status-danger": "#f43f5e",
      "status-success": "#10b981",
    };
    const normalizedTypes = parsedTypes.map((t: { id: string; name: string; color?: string; colorVar?: string }) => ({
      id: t.id,
      name: t.name,
      color: t.color || (t.colorVar ? colorVarMap[t.colorVar] || "#00f0ff" : "#00f0ff"),
    }));

    return {
      siteId: setting.siteId,
      eventTypes: normalizedTypes,
      holidayDays: JSON.parse(setting.holidayDays || "[]"),
      customHolidays: JSON.parse(setting.customHolidays || "[]")
    };
  }

  return { 
    siteId, 
    eventTypes: [
      { id: "meeting", name: "会議", color: "#0ea5e9" },
      { id: "test", name: "送電試験", color: "#f59e0b" },
      { id: "construction", name: "工事", color: "#00f0ff" },
      { id: "other", name: "その他", color: "#94a3b8" }
    ], 
    holidayDays: [0, 6],
    customHolidays: []
  };
});
