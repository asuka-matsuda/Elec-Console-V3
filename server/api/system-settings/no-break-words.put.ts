/**
 * 改行禁止ワード一括保存 API
 * PUT /api/system-settings/no-break-words
 *
 * @description テキスト改行禁止用の単語リストを一括保存・更新します。
 * @permission システム管理者限定
 */

import { defineEventHandler, readBody } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireMasterUser } from '../../utils/auth'
import { createAppError } from '../../utils/error'
import { parseNoBreakWords, serializeNoBreakWords } from '../../utils/jsonFields'
import { prisma } from '../../utils/prisma'

const SETTING_KEY = 'no_break_words'

export default defineEventHandler(async (event) => {
  // 1. マスターユーザー認可チェック (loginId === 'master')
  await requireMasterUser(event)

  // 2. リクエストボディの取得とバリデーション
  const body = await readBody<{ words?: unknown }>(event).catch(() => null)

  if (!body || !Array.isArray(body.words)) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: '改行禁止ワードの配列（words）が指定されていません。',
    })
  }

  // 3. サニタイズ＆シリアライズ（トリム、空文字除外、100文字上限、重複排除）
  const jsonValue = serializeNoBreakWords(body.words) ?? '[]'
  const sanitizedWords = parseNoBreakWords(jsonValue)

  // 4. DB に upsert
  await prisma.systemSetting.upsert({
    where: { key: SETTING_KEY },
    update: { value: jsonValue },
    create: {
      key: SETTING_KEY,
      value: jsonValue,
    },
  })

  return {
    success: true,
    words: sanitizedWords,
  }
})
