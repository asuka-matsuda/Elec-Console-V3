/**
 * マスター帳票テンプレート削除・解除 API
 * DELETE /api/master/templates/:id
 *
 * @description 登録済みの共通ひな形Excelファイルを削除して未登録状態に戻します。
 * @permission マスター管理者限定
 */

import { createError, defineEventHandler, getRouterParam } from 'h3'

import { requireMasterUser } from '../../../utils/auth'
import { deleteMasterTemplateItem } from '../../../utils/masterTemplates'

export default defineEventHandler(async (event) => {
  await requireMasterUser(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'テンプレートIDが指定されていません',
    })
  }

  const deleted = await deleteMasterTemplateItem(id)

  if (!deleted) {
    throw createError({
      statusCode: 404,
      message: '指定されたテンプレートファイルは登録されていません',
    })
  }

  return { success: true, id }
})
