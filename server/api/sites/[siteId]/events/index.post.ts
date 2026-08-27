
import { defineEventHandler, readBody, getRouterParam } from 'h3';
import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
  const siteId = getRouterParam(event, 'siteId');
  const body = await readBody(event);
  
  const dbPath = path.resolve(process.cwd(), 'server/data/events.json');
  let events = [];
  if (fs.existsSync(dbPath)) {
    events = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  }
  
  const newEvent = {
    ...body,
    id: Date.now().toString(),
    siteId
  };
  
  events.push(newEvent);
  fs.writeFileSync(dbPath, JSON.stringify(events, null, 2));
  return newEvent;
});
