/**
 * 現場別改行禁止ワード保存 API
 * PUT /api/sites/:siteId/no-break-words
 *
 * @description 指定された現場に設定する改行禁止ワード一覧を保存・更新します。
 * @permission 管理者・マスター限定
 */

import { createError, defineEventHandler, getRouterParam } from 'h3'
import { z } from 'zod'

import { requireSiteAdmin } from '../../../utils/auth'
import { parseNoBreakWords, serializeNoBreakWords } from '../../../utils/jsonFields'
import { prisma } from '../../../utils/prisma'
import { validateRequestBody } from '../../../utils/validation'

const UpdateNoBreakWordsSchema = z.object({
  words: z.array(z.string()).default([]),
})

export default defineEventHandler(async (event) => {
  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createError({
      statusCode: 400,
      message: '現場IDが指定されていません。',
    })
  }

  // 現場管理者またはマスター権限を検証
  await requireSiteAdmin(event, siteId)

  const body = await validateRequestBody(event, UpdateNoBreakWordsSchema)
  const rawWords = body.words

  const serialized = serializeNoBreakWords(rawWords)

  const settings = await prisma.siteSettings.upsert({
    where: { siteId },
    create: {
      siteId,
      noBreakWords: serialized,
    },
    update: {
      noBreakWords: serialized,
    },
  })

  return {
    success: true,
    siteId,
    words: parseNoBreakWords(settings.noBreakWords),
  }
})
