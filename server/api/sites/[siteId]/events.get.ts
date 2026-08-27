import { defineEventHandler, getRouterParam } from "h3";
import fs from "fs";
import path from "path";

export default defineEventHandler((event) => {
  const siteId = getRouterParam(event, "siteId");
  const dbPath = path.resolve(process.cwd(), "server/data/events.json");
  if (fs.existsSync(dbPath)) {
    try {
      const fileContent = fs.readFileSync(dbPath, "utf-8");
      if (fileContent.trim()) {
        const events = JSON.parse(fileContent);
        return events.filter((e: any) => e.siteId === siteId);
      }
    } catch (error) {
      console.error("API Error in events.get.ts:", error);
    }
  }
  return [];
});