import { defineEventHandler, getRouterParam, createError } from "h3";
import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) throw new Error("id is required");
    
    await prisma.event.delete({
      where: { id }
    });
    
    return { success: true };
  } catch (error) {
    console.error("API Error in [id].delete.ts:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});