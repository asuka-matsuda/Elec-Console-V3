
import { defineEventHandler } from 'h3';
import fs from 'fs';
import path from 'path';

export default defineEventHandler((_event) => {
  const dbPath = path.resolve(process.cwd(), 'server/data/sites.json');
  let sites = [];
  if (fs.existsSync(dbPath)) {
    sites = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  }
  
  const settingsPath = path.resolve(process.cwd(), 'server/data/site-settings.json');
  let siteSettings = [];
  if (fs.existsSync(settingsPath)) {
    siteSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  }

  return { sites, siteSettings };
});
