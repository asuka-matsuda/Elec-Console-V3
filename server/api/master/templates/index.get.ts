/**
 * マスター帳票テンプレート一覧取得 API
 * GET /api/master/templates
 *
 * @description システム共通の帳票ひな形Excel登録状況を取得します。
 * @permission 認証済みユーザー
 */

import { defineEventHandler, getQuery } from 'h3'

import { requireAuthUser } from '../../../utils/auth'
import { getAllMasterTemplateItems, getAllMasterTemplatesMeta } from '../../../utils/masterTemplates'

export default defineEventHandler(async (event) => {
  await requireAuthUser(event)

  const query = getQuery(event)
  const siteId = query.siteId ? String(query.siteId) : undefined

  // 旧仕様互換（テストや単一マップ取得用）
  if (query.format === 'legacy') {
    return getAllMasterTemplatesMeta()
  }

  const items = getAllMasterTemplateItems(siteId)

  return { items }
})
