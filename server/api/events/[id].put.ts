import { defineEventHandler, readBody, getRouterParam, createError } from "h3";
import fs from "fs";
import path from "path";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    const body = await readBody(event);
    
    const dbPath = path.resolve(process.cwd(), "server/data/events.json");
    if (fs.existsSync(dbPath)) {
      let events = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      let updated = null;
      events = events.map((e: any) => {
        if (e.id === id) {
          updated = { ...e, ...body, id }; // idは上書きさせない
          return updated;
        }
        return e;
      });
      if (updated) {
        fs.writeFileSync(dbPath, JSON.stringify(events, null, 2), "utf-8");
        return updated;
      }
    }
    
    throw createError({
      statusCode: 404,
      statusMessage: "Event not found"
    });
  } catch (error) {
    console.error("API Error in events/[id].put.ts:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});