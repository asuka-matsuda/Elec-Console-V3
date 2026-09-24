/**
 * 現場別改行禁止ワード取得 API
 * GET /api/sites/:siteId/no-break-words
 *
 * @description 指定された現場に設定された改行禁止ワード一覧を取得します。
 * @permission 現場アクセス権を持つ認証済みユーザー（master / アサイン作業員）
 */

import { createError, defineEventHandler, getRouterParam } from 'h3'

import { requireSiteAccess } from '../../../utils/auth'
import { parseNoBreakWords } from '../../../utils/jsonFields'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createError({
      statusCode: 400,
      message: '現場IDが指定されていません。',
    })
  }

  // 現場へのアクセス権を検証
  await requireSiteAccess(event, siteId)

  const settings = await prisma.siteSettings.findUnique({
    where: { siteId },
    select: { noBreakWords: true },
  })

  return {
    success: true,
    siteId,
    words: parseNoBreakWords(settings?.noBreakWords),
  }
})
