/**
 * ダッシュボード概要情報取得 API
 * GET /api/dashboard
 *
 * @description お知らせ一覧およびシステム更新履歴を取得します。未初期化時はシードデータから自動構築します。
 * @permission 認証済みユーザー
 */

import { defineEventHandler } from 'h3'

import { requireAuthUser } from '../utils/auth'
import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  // 認証済みユーザーのみアクセス可能（未認証の外部・Botからの漏洩を防止）
  await requireAuthUser(event)

  // 1. お知らせの取得
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
  })

  // 2. 更新履歴の取得
  const history = await prisma.history.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return {
    announcements,
    history,
  }
})
