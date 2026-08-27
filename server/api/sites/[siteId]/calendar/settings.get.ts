
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
  return { 
    siteId, 
    eventTypes: [
      { id: 'meeting', name: '会議', colorVar: 'category-main' },
      { id: 'test', name: '送電試験', colorVar: 'status-warning' },
      { id: 'construction', name: '工事', colorVar: 'category-database' },
      { id: 'other', name: 'その他', colorVar: 'text-muted' }
    ], 
    holidayDays: [0, 6],
    customHolidays: [] // YYYY-MM-DD strings
  }; // default 
});
