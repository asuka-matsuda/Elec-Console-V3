export type SiteStatus = 'planning' | 'in_progress' | 'completed';

export type Site = {
  id: string;
  name: string;
  status: SiteStatus;
  createdAt: string;
  disabledAt: string | null;
};

export type SiteSettings = {
  siteId: string;
  phase2ThresholdMegOhm: number;
  enablePhase3: boolean;
};
