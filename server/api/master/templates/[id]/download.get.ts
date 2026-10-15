/**
 * マスター帳票テンプレートひな形ファイルダウンロード API
 * GET /api/master/templates/:id/download
 *
 * @description 登録済みの共通ひな形Excelファイルをダウンロードします。
 * @permission 認証済みユーザー
 */

import fs from 'node:fs'
import path from 'node:path'

import { defineEventHandler, getRouterParam, setHeader } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { canAccessSite, isSuperUser, requireAuthUser } from '../../../../utils/auth'
import { createAppError } from '../../../../utils/error'
import { getMasterTemplateItem, getMasterTemplateItemFilePath } from '../../../../utils/masterTemplates'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: 'テンプレートIDが指定されていません',
    })
  }

  const item = getMasterTemplateItem(id)
  const filePath = getMasterTemplateItemFilePath(id)

  if (!item || !filePath || !fs.existsSync(filePath)) {
    throw createAppError({
      code: ErrorCode.SYS_NOT_FOUND,
      message: '指定されたテンプレートファイルは登録されていません',
    })
  }

  if (!item.isAllSites && !isSuperUser(user)) {
    const hasAccess = (item.assignedSiteIds ?? []).some(sid => canAccessSite(user, sid))

    if (!hasAccess) {
      throw createAppError({
        code: ErrorCode.AUTH_FORBIDDEN_ACTION,
        message: 'このテンプレートへのアクセス権限がありません',
      })
    }
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
