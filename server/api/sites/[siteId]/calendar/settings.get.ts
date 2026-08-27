
import { defineEventHandler, getRouterParam } from 'h3';
import fs from 'fs';
import path from 'path';

export default defineEventHandler((event) => {
  const siteId = getRouterParam(event, 'siteId');
  const dbPath = path.resolve(process.cwd(), 'server/data/calendar-settings.json');
  if (fs.existsSync(dbPath)) {
    const settings = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const siteSettings = settings.find((s: Record<string, unknown>) => s.siteId === siteId);
    if (siteSettings) return siteSettings;
  }
  return { siteId, eventTypes: [], holidayDays: [0, 6] }; // default 
});
