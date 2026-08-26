import type { Site, SiteSettings } from '~/types/admin';
import type { User } from '~/types/auth';

export const mockUsers: User[] = [
  { 
    id: 'u1', 
    firstName: '飛鳥',
    lastName: '松田',
    lastNameKana: '',
    firstNameKana: '',
    loginId: 'master', 
    role: 'admin', 
    assignedSiteIds: ['s1', 's2'],
    requirePasswordReset: false,
    lastLoginAt: '2026-08-25T08:00:00Z',
    email: 'test@example.com', isActive: true, createdAt: '2026-08-01T10:00:00Z' 
  },
  { 
    id: 'u2', 
    firstName: '一郎', 
    lastName: '鈴木',
    lastNameKana: '',
    firstNameKana: '', 
    loginId: 'suzuki-i', 
    role: 'worker', 
    assignedSiteIds: ['s1'],
    requirePasswordReset: true,
    lastLoginAt: null,
    email: 'test@example.com', isActive: true, createdAt: '2026-08-02T10:00:00Z' 
  },
  { 
    id: 'u3', 
    firstName: '次郎', 
    lastName: '佐藤',
    lastNameKana: '',
    firstNameKana: '', 
    loginId: 'sato-j', 
    role: 'viewer', 
    assignedSiteIds: ['s2'],
    requirePasswordReset: false,
    lastLoginAt: '2026-08-24T15:00:00Z',
    email: 'test@example.com', isActive: true, createdAt: '2026-08-03T10:00:00Z' 
  },
];

export const mockSites: Site[] = [
  { id: 's1', name: '新国立競技場', status: 'in_progress', createdAt: '2026-07-01T10:00:00Z', disabledAt: null },
  { id: 's2', name: '虎ノ門ヒルズ', status: 'planning', createdAt: '2026-07-15T10:00:00Z', disabledAt: null },
];

export const mockSiteSettings: SiteSettings[] = [
  { siteId: 's1', phase2ThresholdMegOhm: 1.0, enablePhase3: true },
  { siteId: 's2', phase2ThresholdMegOhm: 0.5, enablePhase3: false },
];
