/**
 * システム設定改行禁止ワード取得 API
 * GET /api/system-settings/no-break-words
 *
 * @description フロントエンドの自然な禁則処理・折返し防止に使用する登録単語リストを取得します。
 * @permission パブリック（全ユーザー利用可）
 */

import { defineEventHandler } from 'h3'

import { requireAuthUser } from '../../utils/auth'
import { parseNoBreakWords } from '../../utils/jsonFields'
import { prisma } from '../../utils/prisma'

const SETTING_KEY = 'no_break_words'

export default defineEventHandler(async (event) => {
  await requireAuthUser(event)

  const setting = await prisma.systemSetting.findUnique({
    where: { key: SETTING_KEY },
  })

  return {
    success: true,
    words: parseNoBreakWords(setting?.value),
  }
})
