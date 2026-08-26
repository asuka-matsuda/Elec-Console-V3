export type UserRole = 'admin' | 'worker' | 'viewer';

export type User = {
  id: string;
  firstName: string;
  firstNameKana: string;
  lastName: string;
  lastNameKana: string;
  loginId: string;
  role: UserRole;
  assignedSiteIds: string[];
  requirePasswordReset: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  
  // 他にもあった気がしますが、と言われたもの
  // 業務システムとして必須なものを追加
  email?: string;
  isActive: boolean;
};
