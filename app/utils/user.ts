/**
 * ユーザー表示・フォーマットユーティリティ
 */

import type { User } from '#shared/types/auth'

/**
 * ユーザーのフルネーム（姓 名）を取得します。
 * 未設定または空の場合は「（未設定）」を返します。
 */
export function formatUserFullName(user?: Partial<Pick<User, 'lastName' | 'firstName'>> | null): string {
  if (!user) return '（未設定）'

  return `${user.lastName || ''} ${user.firstName || ''}`.trim() || '（未設定）'
}

/**
 * ユーザーのフリガナ（姓カナ 名カナ）を取得します。
 * 未設定または空の場合は空文字を返します。
 */
export function formatUserKana(user?: Partial<Pick<User, 'lastNameKana' | 'firstNameKana'>> | null): string {
  if (!user) return ''

  return `${user.lastNameKana || ''} ${user.firstNameKana || ''}`.trim()
}
