/**
 * マスター帳票テンプレート一覧取得 API
 * GET /api/master/templates
 *
 * @description システム共通の帳票ひな形Excel登録状況を取得します。
 * @permission 認証済みユーザー
 */

import { defineEventHandler, getQuery } from 'h3'

import { canAccessSite, isSuperUser, requireAuthUser, requireSiteAccess } from '../../../utils/auth'
import { getAllMasterTemplateItems } from '../../../utils/masterTemplates'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)

  const query = getQuery(event)
  const siteId = query.siteId ? String(query.siteId) : undefined

  if (siteId) {
    await requireSiteAccess(event, siteId)
  }

  // siteId 未指定時の全件取得（サイト専用テンプレート含む）は master のみ許可。一般ユーザーは自身の担当現場または全現場共通のみにフィルタ
  const allItems = getAllMasterTemplateItems(siteId)
  const items = !siteId && !isSuperUser(user)
    ? allItems.filter(item => item.isAllSites || (item.assignedSiteIds ?? []).some(sid => canAccessSite(user, sid)))
    : allItems

  return { items }
})
