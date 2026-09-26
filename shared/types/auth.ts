/**
 * 認証・認可関連型定義
 *
 * ユーザーモデル、ロール権限、サイトアサイン情報等を定義します。
 */

export type UserRole = 'admin' | 'worker' | 'viewer'

export type SiteAssignment = {
  siteId: string
  role: UserRole
}

export type User = {
  id: string
  firstName: string
  firstNameKana: string
  lastName: string
  lastNameKana: string
  loginId: string
  role: UserRole
  assignedSiteIds: string[]
  siteAssignments?: SiteAssignment[]
  requirePasswordReset: boolean
  lastLoginAt: string | null
  createdAt: string

  /** 連絡用メールアドレス（任意） */
  email?: string
  /** アカウント有効状態フラグ */
  isActive: boolean
}
