/**
 * マスター帳票テンプレートひな形ファイルダウンロード API
 * GET /api/master/templates/:id/download
 *
 * @description 登録済みの共通ひな形Excelファイルをダウンロードします。
 * @permission 認証済みユーザー
 */

import fs from 'node:fs'
import path from 'node:path'

import { createError, defineEventHandler, getRouterParam, setHeader } from 'h3'

import { requireAuthUser } from '../../../../utils/auth'
import { getMasterTemplateItem, getMasterTemplateItemFilePath } from '../../../../utils/masterTemplates'

export default defineEventHandler(async (event) => {
  await requireAuthUser(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'テンプレートIDが指定されていません',
    })
  }

  const item = getMasterTemplateItem(id)
  const filePath = getMasterTemplateItemFilePath(id)

  if (!item || !filePath || !fs.existsSync(filePath)) {
    throw createError({
      statusCode: 404,
      message: '指定されたテンプレートファイルは登録されていません',
    })
  }

  const filename = encodeURIComponent(item.file.filename || path.basename(filePath))

  const ext = path.extname(filePath).toLowerCase()
  const isXlsm = ext === '.xlsm'
  const contentType = isXlsm
    ? 'application/vnd.ms-excel.sheet.macroEnabled.12'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

  const buffer = await fs.promises.readFile(filePath)

  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Content-Disposition', `attachment; filename*=UTF-8''${filename}`)
  setHeader(event, 'Content-Length', buffer.length)

  return buffer
})
