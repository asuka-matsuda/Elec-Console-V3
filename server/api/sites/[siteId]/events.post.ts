import { defineEventHandler, readBody, getRouterParam, createError } from "h3";
import fs from "fs";
import path from "path";

export default defineEventHandler(async (event) => {
  try {
    const siteId = getRouterParam(event, "siteId");
    const body = await readBody(event);
    
    const dataDir = path.resolve(process.cwd(), "server/data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dbPath = path.join(dataDir, "events.json");
    
    let events = [];
    if (fs.existsSync(dbPath)) {
      const fileContent = fs.readFileSync(dbPath, "utf-8");
      if (fileContent.trim()) {
        events = JSON.parse(fileContent);
      }
    }
    
    const newEvent = {
      ...body,
      id: Date.now().toString(),
      siteId
    };
    
    events.push(newEvent);
    fs.writeFileSync(dbPath, JSON.stringify(events, null, 2), "utf-8");
    
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