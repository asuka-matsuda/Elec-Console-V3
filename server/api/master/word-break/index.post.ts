/**
 * 単語分割設定新規作成 API
 * POST /api/master/word-break
 *
 * @description 新しい改行禁止単語を登録します。
 * @permission システム管理者限定
 */

import { randomUUID } from 'node:crypto'

import { createError, defineEventHandler, readBody } from 'h3'

import type { WordBreakItem } from '#shared/types/master'

import { requireMasterUser } from '../../../utils/auth'
import { getWordBreakItems, saveWordBreakItems } from './index.get'

export default defineEventHandler(async (event) => {
  await requireMasterUser(event)

  const body = await readBody<{ word?: string, date?: string }>(event)
  const word = body?.word?.trim()
  const date = body?.date?.trim()

  if (!word || word.length < 2 || word.length > 50) {
    throw createError({
      statusCode: 400,
      message: '単語は2〜50文字で入力してください。',
    })
  }

  if (!date) {
    throw createError({
      statusCode: 400,
      message: '追加日を入力してください。',
    })
  }

  const items = await getWordBreakItems()

  if (items.some(i => i.word === word)) {
    throw createError({
      statusCode: 400,
      message: 'その単語は既に登録されています。',
    })
  }

  const newItem: WordBreakItem = {
    id: randomUUID(),
    word,
    date,
  }

  items.unshift(newItem)
  await saveWordBreakItems(items)

  return newItem
})
