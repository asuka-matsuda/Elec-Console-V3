export type SiteStatus = 'planning' | 'in_progress' | 'completed';

export type Site = {
  id: string;
  name: string;
  address: string;
  status: SiteStatus;
  createdAt: string;
};

export type SiteSettings = {
  siteId: string;
  phase2ThresholdMegOhm: number;
  enablePhase3: boolean;
};
