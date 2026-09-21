/**
 * 単語分割設定更新 API
 * PUT /api/master/word-break/:id
 *
 * @description 指定された改行禁止単語の設定を更新します。
 * @permission システム管理者限定
 */

import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'

import { requireMasterUser } from '../../../utils/auth'
import { getWordBreakItems, saveWordBreakItems } from './index.get'

export default defineEventHandler(async (event) => {
  await requireMasterUser(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'IDが指定されていません。',
    })
  }

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
  const index = items.findIndex(i => i.id === id)

  if (index === -1) {
    throw createError({
      statusCode: 404,
      message: '対象の改行禁止ワードが見つかりません。',
    })
  }

  if (items.some((i, idx) => idx !== index && i.word === word)) {
    throw createError({
      statusCode: 400,
      message: 'その単語は既に登録されています。',
    })
  }

  items[index] = {
    id,
    word,
    date,
  }

  await saveWordBreakItems(items)

  return items[index]
})
