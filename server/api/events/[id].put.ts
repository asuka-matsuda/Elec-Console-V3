
import { defineEventHandler, readBody, getRouterParam } from 'h3';
import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  
  const dbPath = path.resolve(process.cwd(), 'server/data/events.json');
  if (fs.existsSync(dbPath)) {
    let events = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    let updated = null;
    events = events.map((e: Record<string, unknown>) => {
      if (e.id === id) {
        updated = { ...e, ...body };
        return updated;
      }
      return e;
    });
    if (updated) {
      fs.writeFileSync(dbPath, JSON.stringify(events, null, 2));
      return updated;
    }
  }
  return null;
});
