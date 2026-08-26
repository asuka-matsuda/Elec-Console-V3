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
    assignedSiteIds: [],
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
    assignedSiteIds: [],
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
    assignedSiteIds: [],
    requirePasswordReset: false,
    lastLoginAt: '2026-08-24T15:00:00Z',
    email: 'test@example.com', isActive: true, createdAt: '2026-08-03T10:00:00Z' 
  },
];

export const mockSites: Site[] = [];

export const mockSiteSettings: SiteSettings[] = [];
