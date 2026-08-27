import { defineEventHandler, getRouterParam, createError } from "h3";
import fs from "fs";
import path from "path";

export default defineEventHandler((event) => {
  try {
    const id = getRouterParam(event, "id");
    const dbPath = path.resolve(process.cwd(), "server/data/events.json");
    if (fs.existsSync(dbPath)) {
      const events = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      const filtered = events.filter((e: any) => e.id !== id);
      fs.writeFileSync(dbPath, JSON.stringify(filtered, null, 2), "utf-8");
    }
    return { success: true };
  } catch (error) {
    console.error("API Error in events/[id].delete.ts:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});