import { createError, defineEventHandler, readBody } from 'h3'

import { requireMasterUser } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

const SETTING_KEY = 'no_break_words'

export default defineEventHandler(async (event) => {
  // 1. マスターユーザー認可チェック (loginId === 'master')
  await requireMasterUser(event)

  // 2. リクエストボディの取得とバリデーション
  const body = await readBody<{ words?: unknown }>(event)

  if (!body || !Array.isArray(body.words)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: '改行禁止ワードの配列（words）が指定されていません。',
    })
  }

  // 3. サニタイズ（トリム、空文字除外、重複排除）
  const sanitizedWords: string[] = []
  const seen = new Set<string>()

  for (const item of body.words) {
    if (typeof item === 'string') {
      const trimmed = item.trim()

      if (trimmed.length > 0 && trimmed.length <= 100 && !seen.has(trimmed)) {
        seen.add(trimmed)
        sanitizedWords.push(trimmed)
      }
    }
  }

  // 4. DB に upsert
  const jsonValue = JSON.stringify(sanitizedWords)

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
