/**
 * 単語分割設定一覧取得 API
 * GET /api/master/word-break
 *
 * @description 登録済みの単語改行ルール一覧を取得します。
 * @permission システム管理者限定
 */

import { defineEventHandler } from 'h3'

import type { WordBreakItem } from '#shared/types/master'

import { requireMasterUser } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export const SETTING_KEY = 'no_break_words'

export async function getWordBreakItems(): Promise<WordBreakItem[]> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: SETTING_KEY },
  })

  if (!setting || !setting.value) return []

  try {
    const parsed = JSON.parse(setting.value)

    if (!Array.isArray(parsed)) return []

    return parsed.map((item, index) => {
      if (typeof item === 'string') {
        return {
          id: String(index + 1),
          word: item,
          date: '2026.09.19',
        }
      }

      return item as WordBreakItem
    })
  }
  catch {
    return []
  }
}

export async function saveWordBreakItems(items: WordBreakItem[]): Promise<void> {
  const jsonValue = JSON.stringify(items)

  await prisma.systemSetting.upsert({
    where: { key: SETTING_KEY },
    update: { value: jsonValue },
    create: {
      key: SETTING_KEY,
      value: jsonValue,
    },
  })
}

export default defineEventHandler(async (event) => {
  await requireMasterUser(event)

  return await getWordBreakItems()
})
