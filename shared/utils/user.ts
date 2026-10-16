/**
 * ユーザー表示・フォーマット共有ユーティリティ（SSoT）
 * クライアントとサーバーの双方が参照する単一真実源です。
 */

interface NameableUser {
  firstName?: string | null
  lastName?: string | null
  firstNameKana?: string | null
  lastNameKana?: string | null
  loginId?: string | null
}

/**
 * ユーザーのフルネーム（姓 名）を取得します。
 * 未設定または空の場合は「（未設定）」を返します。
 */
export function formatUserFullName(user?: NameableUser | null): string {
  if (!user) return '（未設定）'

  return `${user.lastName || ''} ${user.firstName || ''}`.trim() || '（未設定）'
}

/**
 * ユーザーのフリガナ（姓カナ 名カナ）を取得します。
 * 未設定または空の場合は空文字を返します。
 */
export function formatUserKana(user?: NameableUser | null): string {
  if (!user) return ''

  return `${user.lastNameKana || ''} ${user.firstNameKana || ''}`.trim()
}

/**
 * ユーザーの作業者表示名（フルネーム、なければログインID、なければフォールバック）を取得します。
 */
export function getUserDisplayName(
  user?: NameableUser | null,
  fallback = '現場作業者',
): string {
  if (!user) return fallback

  const fullName = `${user.lastName || ''} ${user.firstName || ''}`.trim()

  return fullName || user.loginId?.trim() || fallback
}
