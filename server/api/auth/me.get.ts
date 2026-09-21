/**
 * セッションユーザー情報取得 API
 * GET /api/auth/me
 *
 * @description 現在のセッショントークンからログイン中ユーザーの基本情報および割り当て現場一覧を取得します。
 * @permission 認証済みユーザー
 */

import { defineEventHandler } from 'h3'

import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)

  return { success: true, user, serverTime: new Date().toISOString() }
})
