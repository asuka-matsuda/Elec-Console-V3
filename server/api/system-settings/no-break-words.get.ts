/**
 * システム設定改行禁止ワード取得 API
 * GET /api/system-settings/no-break-words
 *
 * @description フロントエンドの自然な禁則処理・折返し防止に使用する登録単語リストを取得します。
 * @permission パブリック（全ユーザー利用可）
 */

import { defineEventHandler } from 'h3'

import { requireAuthUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

const SETTING_KEY = 'no_break_words'

export default defineEventHandler(async (event) => {
  await requireAuthUser(event)
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTING_KEY },
    })

    if (!setting || !setting.value) {
      return {
        success: true,
        words: [] as string[],
      }
    }

    const parsed = JSON.parse(setting.value)
    const words = Array.isArray(parsed)
      ? parsed
          .map((item: unknown) => {
            if (typeof item === 'string') return item.trim()
            if (item && typeof item === 'object' && 'word' in item && typeof (item as { word: unknown }).word === 'string') {
              return (item as { word: string }).word.trim()
            }

            return ''
          })
          .filter((w): w is string => w.length > 0)
      : []

    return {
      success: true,
      words,
    }
  }
  catch (error) {
    console.error('Failed to get system no_break_words setting:', error)

    return {
      success: true,
      words: [] as string[],
    }
  }
})
