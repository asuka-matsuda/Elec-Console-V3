
import { defineEventHandler, readBody, createError } from 'h3';
import fs from 'fs';
import path from 'path';
import type { Site, SiteSettings } from '~/types/admin';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const dbPath = path.resolve(process.cwd(), 'server/data/sites.json');
  let sites: Site[] = [];
  if (fs.existsSync(dbPath)) {
    sites = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  }

  if (sites.find(s => s.id === body.id)) {
    throw createError({
      statusCode: 409,
      statusMessage: '指定された現場IDは既に存在します。',
    });
  }

  const newSite: Site = {
    ...body,
    createdAt: new Date().toISOString(),
    disabledAt: null,
  };
  
  sites.push(newSite);
  fs.writeFileSync(dbPath, JSON.stringify(sites, null, 2));

  const settingsPath = path.resolve(process.cwd(), 'server/data/site-settings.json');
  let siteSettings: SiteSettings[] = [];
  if (fs.existsSync(settingsPath)) {
    siteSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  }
  const newSettings: SiteSettings = {
    siteId: newSite.id,
    phase2ThresholdMegOhm: 1.0,
    enablePhase3: true
  };
  siteSettings.push(newSettings);
  fs.writeFileSync(settingsPath, JSON.stringify(siteSettings, null, 2));

  return { site: newSite, settings: newSettings };
});
