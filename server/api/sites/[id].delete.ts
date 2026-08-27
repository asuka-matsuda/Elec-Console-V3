
import { defineEventHandler, getRouterParam } from 'h3';
import fs from 'fs';
import path from 'path';
import type { Site, SiteSettings } from '~/types/admin';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  
  const dbPath = path.resolve(process.cwd(), 'server/data/sites.json');
  if (fs.existsSync(dbPath)) {
    const sites = JSON.parse(fs.readFileSync(dbPath, 'utf-8')) as Site[];
    fs.writeFileSync(dbPath, JSON.stringify(sites.filter(s => s.id !== id), null, 2));
  }
  
  const settingsPath = path.resolve(process.cwd(), 'server/data/site-settings.json');
  if (fs.existsSync(settingsPath)) {
    const siteSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')) as SiteSettings[];
    fs.writeFileSync(settingsPath, JSON.stringify(siteSettings.filter(s => s.siteId !== id), null, 2));
  }
  
  return { success: true };
});
