
import { defineEventHandler, getRouterParam } from 'h3';
import fs from 'fs';
import path from 'path';

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id');
  const dbPath = path.resolve(process.cwd(), 'server/data/events.json');
  if (fs.existsSync(dbPath)) {
    const events = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const filtered = events.filter((e: Record<string, unknown>) => e.id !== id);
    fs.writeFileSync(dbPath, JSON.stringify(filtered, null, 2));
  }
  return { success: true };
});
