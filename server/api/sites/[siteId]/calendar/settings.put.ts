
import { defineEventHandler, readBody, getRouterParam } from 'h3';
import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
  const siteId = getRouterParam(event, 'siteId');
  const body = await readBody(event);
  
  const dbPath = path.resolve(process.cwd(), 'server/data/calendar-settings.json');
  let settings = [];
  if (fs.existsSync(dbPath)) {
    settings = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  }
  
  const index = settings.findIndex((s: Record<string, unknown>) => s.siteId === siteId);
  const newSettings = { siteId, ...body };
  
  if (index >= 0) {
    settings[index] = newSettings;
  } else {
    settings.push(newSettings);
  }
  
  fs.writeFileSync(dbPath, JSON.stringify(settings, null, 2));
  return newSettings;
});
