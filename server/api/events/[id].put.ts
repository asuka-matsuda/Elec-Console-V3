import { defineEventHandler, readBody, getRouterParam, createError } from "h3";
import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) throw new Error("id is required");
    
    const body = await readBody(event);
    
    const updated = await prisma.event.update({
      where: { id },
      data: {
        title: body.title,
        start: body.start,
        end: body.end || null,
        allDay: body.allDay,
        type: body.type,
      }
    });
    
    return updated;
  } catch (error) {
    console.error("API Error in [id].put.ts:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});