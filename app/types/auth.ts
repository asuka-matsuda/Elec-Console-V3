export type UserRole = 'admin' | 'worker' | 'viewer';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}
