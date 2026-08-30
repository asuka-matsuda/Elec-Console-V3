import { defineEventHandler, readBody, getRouterParam, createError } from "h3";
import { prisma } from "../../../utils/prisma";
import { requireAuthUser } from "../../../utils/auth";

export default defineEventHandler(async (event) => {
  await requireAuthUser(event);

  try {
    const siteId = getRouterParam(event, "siteId");
    if (!siteId) throw new Error("siteId is required");
    
    const body = await readBody(event);
    
    const newEvent = await prisma.event.create({
      data: {
        siteId,
        title: body.title,
        start: body.start,
        end: body.end || null,
        allDay: body.allDay || false,
        type: body.type || "other",
      }
    });
    
    return newEvent;
  } catch (error) {
    console.error("API Error in events.post.ts:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});