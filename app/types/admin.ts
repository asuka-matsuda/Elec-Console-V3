export type SiteStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold';

export type Site = {
  id: string;
  name: string;
  status: SiteStatus;
  createdAt: string;
  disabledAt: string | null;
  excelPath?: string;
  reportTemplatePath?: string;
  excludedCircuits?: string[];
  workers?: string[];
};

export type SiteSettings = {
  siteId: string;
  phase2ThresholdMegOhm: number;
  enablePhase3: boolean;
};
