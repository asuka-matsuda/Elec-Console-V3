
import { defineEventHandler, readBody, getRouterParam } from 'h3';
import fs from 'fs';
import path from 'path';
import type { Site, SiteSettings } from '~/types/admin';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const updates = await readBody(event); // { site: Partial<Site>, settings?: Partial<SiteSettings> }
  
  const dbPath = path.resolve(process.cwd(), 'server/data/sites.json');
  let sites: Site[] = [];
  if (fs.existsSync(dbPath)) {
    sites = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  }
  
  let updatedSite: Site | undefined = undefined;
  sites = sites.map(s => {
    if (s.id === id) {
      updatedSite = { ...s, ...(updates.site || {}) };
      return updatedSite as Site;
    }
    return s;
  });
  
  if (updatedSite) {
    fs.writeFileSync(dbPath, JSON.stringify(sites, null, 2));
  }
  
  let updatedSettings: SiteSettings | undefined = undefined;
  if (updates.settings || (updates.site && updates.site.id && updates.site.id !== id)) {
    const settingsPath = path.resolve(process.cwd(), 'server/data/site-settings.json');
    let siteSettings: SiteSettings[] = [];
    if (fs.existsSync(settingsPath)) {
      siteSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }
    
    const targetSiteId = (updates.site && updates.site.id) ? updates.site.id : id;
    
    let found = false;
    siteSettings = siteSettings.map(set => {
      if (set.siteId === id) {
        found = true;
        updatedSettings = { ...set, ...(updates.settings || {}), siteId: targetSiteId };
        return updatedSettings as SiteSettings;
      }
      return set;
    });
    
    if (!found) {
      updatedSettings = { siteId: targetSiteId, phase2ThresholdMegOhm: 1.0, enablePhase3: true, ...(updates.settings || {}) };
      siteSettings.push(updatedSettings as SiteSettings);
    }
    
    fs.writeFileSync(settingsPath, JSON.stringify(siteSettings, null, 2));
  }

  return {
    site: updatedSite,
    settings: updatedSettings
  };
});
