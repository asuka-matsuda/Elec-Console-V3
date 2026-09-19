import { createError, defineEventHandler, getRouterParam } from 'h3'

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

  const items = await getWordBreakItems()
  const filtered = items.filter(i => i.id !== id)

  if (filtered.length === items.length) {
    throw createError({
      statusCode: 404,
      message: '対象の改行禁止ワードが見つかりません。',
    })
  }

  await saveWordBreakItems(filtered)

  return { success: true }
})
