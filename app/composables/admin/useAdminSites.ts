import { useState } from '#app';
import type { Site, SiteSettings, SiteStatus } from '~/types/admin';
import { mockSites, mockSiteSettings } from '~/constants/data/adminMockData';

export const useAdminSites = () => {
  const sites = useState<Site[]>('admin-sites', () => [...mockSites]);
  const siteSettings = useState<SiteSettings[]>('admin-site-settings', () => [...mockSiteSettings]);

  const createSite = (site: Omit<Site, 'id' | 'createdAt'>, settings: Omit<SiteSettings, 'siteId'>) => {
    const id = `s${Date.now()}`;
    const newSite: Site = {
      ...site,
      id,
      createdAt: new Date().toISOString(),
    };
    sites.value = [...sites.value, newSite];
    
    siteSettings.value = [...siteSettings.value, { ...settings, siteId: id }];
  };

  const updateSite = (id: string, updates: Partial<Omit<Site, 'id' | 'createdAt'>>) => {
    sites.value = sites.value.map(s => s.id === id ? { ...s, ...updates } : s);
  };

  const deleteSite = (id: string) => {
    sites.value = sites.value.filter(s => s.id !== id);
    siteSettings.value = siteSettings.value.filter(s => s.siteId !== id);
  };

  const updateSettings = (siteId: string, updates: Partial<Omit<SiteSettings, 'siteId'>>) => {
    siteSettings.value = siteSettings.value.map(s => s.siteId === siteId ? { ...s, ...updates } : s);
  };

  const getSettings = (siteId: string) => {
    return siteSettings.value.find(s => s.siteId === siteId) || null;
  };

  return {
    sites,
    siteSettings,
    createSite,
    updateSite,
    deleteSite,
    updateSettings,
    getSettings,
  };
};
