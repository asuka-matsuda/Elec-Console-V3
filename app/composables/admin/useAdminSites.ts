import { useState } from '#app';
import type { Site, SiteSettings } from '~/types/admin';
import { mockSites, mockSiteSettings } from '~/constants/data/adminMockData';

export const useAdminSites = () => {
  const sites = useState<Site[]>('admin-sites', () => [...mockSites]);
  const siteSettings = useState<SiteSettings[]>('admin-site-settings', () => [...mockSiteSettings]);

  // ID はユーザーが手入力するため、引数に含める
  const createSite = (site: Omit<Site, 'createdAt' | 'disabledAt'>) => {
    // 既存IDとの重複チェック
    if (sites.value.find(s => s.id === site.id)) {
      throw new Error('指定された現場IDは既に存在します。');
    }
    const newSite: Site = {
      ...site,
      createdAt: new Date().toISOString(),
      disabledAt: null,
    };
    sites.value = [...sites.value, newSite];
  };

  const updateSite = (id: string, updates: Partial<Omit<Site, 'createdAt' | 'disabledAt'>>) => {
    sites.value = sites.value.map(s => s.id === id ? { ...s, ...updates } : s);
    // もし ID が変更された場合、関連する siteSettings の siteId も更新する
    if (updates.id && updates.id !== id) {
      siteSettings.value = siteSettings.value.map(set => set.siteId === id ? { ...set, siteId: updates.id as string } : set);
    }
  };

  const deleteSite = (id: string) => {
    sites.value = sites.value.filter(s => s.id !== id);
    siteSettings.value = siteSettings.value.filter(s => s.siteId !== id);
  };

  // 現場の無効化（すでに無効化されている場合は有効化するトグル）
  const toggleDisableSite = (id: string) => {
    sites.value = sites.value.map(s => {
      if (s.id === id) {
        return {
          ...s,
          disabledAt: s.disabledAt ? null : new Date().toISOString(),
        };
      }
      return s;
    });
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
    toggleDisableSite,
    updateSettings,
    getSettings,
  };
};
