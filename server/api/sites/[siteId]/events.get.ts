import { defineEventHandler, getRouterParam } from "h3";
import { prisma } from "../../../utils/prisma";
import { requireAuthUser } from "../../../utils/auth";

export default defineEventHandler(async (event) => {
  await requireAuthUser(event);

  try {
    const siteId = getRouterParam(event, "siteId");
    if (!siteId) return [];
    
    const events = await prisma.event.findMany({
      where: { siteId }
    });
    
    return events;
  } catch (error) {
    console.error("API Error in events.get.ts:", error);
    return [];
  }
});
