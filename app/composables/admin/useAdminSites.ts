
import { ref } from 'vue';
import type { Site, SiteSettings } from '~/types/admin';
import { useAsyncData } from '#app';

export const useAdminSites = () => {
  const sites = ref<Site[]>([]);
  const siteSettings = ref<SiteSettings[]>([]);

  // 初期データの取得
  const { refresh: fetchSites } = useAsyncData('admin-sites-fetch', async () => {
    const data = await $fetch<{ sites: Site[], siteSettings: SiteSettings[] }>('/api/sites');
    sites.value = data.sites || [];
    siteSettings.value = data.siteSettings || [];
    return data;
  });

  const createSite = async (site: Omit<Site, 'createdAt' | 'disabledAt'>) => {
    try {
      const res = await $fetch<{ site: Site, settings: SiteSettings }>('/api/sites', {
        method: 'POST',
        body: site,
      });
      sites.value.push(res.site);
      siteSettings.value.push(res.settings);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (err.data?.statusMessage) {
        throw new Error(err.data.statusMessage, { cause: err });
      }
      throw err;
    }
  };

  const updateSite = async (id: string, updates: Partial<Omit<Site, 'createdAt'>>) => {
    const res = await $fetch<{ site: Site, settings: SiteSettings }>(`/api/sites/${id}`, {
      method: 'PUT',
      body: { site: updates },
    });
    
    if (res.site) {
      sites.value = sites.value.map(s => s.id === id ? res.site : s);
    }
    if (res.settings) {
      siteSettings.value = siteSettings.value.map(set => set.siteId === id ? res.settings : set);
    }
  };

  const deleteSite = async (id: string) => {
    await $fetch(`/api/sites/${id}`, { method: 'DELETE' });
    sites.value = sites.value.filter(s => s.id !== id);
    siteSettings.value = siteSettings.value.filter(s => s.siteId !== id);
  };

  const toggleDisableSite = async (id: string) => {
    const site = sites.value.find(s => s.id === id);
    if (!site) return;
    
    const disabledAt = site.disabledAt ? null : new Date().toISOString();
    await updateSite(id, { disabledAt });
  };

  const updateSettings = async (siteId: string, updates: Partial<Omit<SiteSettings, 'siteId'>>) => {
    const res = await $fetch<{ site: Site, settings: SiteSettings }>(`/api/sites/${siteId}`, {
      method: 'PUT',
      body: { settings: updates },
    });
    
    if (res.settings) {
      siteSettings.value = siteSettings.value.map(set => set.siteId === siteId ? res.settings : set);
    }
  };

  const getSettings = (siteId: string) => {
    return siteSettings.value.find(s => s.siteId === siteId) || null;
  };

  return {
    sites,
    siteSettings,
    fetchSites,
    createSite,
    updateSite,
    deleteSite,
    toggleDisableSite,
    updateSettings,
    getSettings,
  };
};
