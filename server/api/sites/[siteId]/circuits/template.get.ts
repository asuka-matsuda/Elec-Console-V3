/**
 * 現場設定のExcel連携テンプレートファイル取得 API
 * GET /api/sites/:siteId/circuits/template
 *
 * @description 現場設定に登録されているExcelファイル（.xlsx または .xlsm）を生バイナリで取得します。
 * @permission 現場アクセス権限
 */
import fs from 'node:fs'
import path from 'node:path'

import { createError, defineEventHandler, getRouterParam, setHeader } from 'h3'

import { requireSiteAccess } from '../../../../utils/auth'
import { validateSafeExcelPath } from '../../../../utils/excel/safePath'
import { prisma } from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireSiteAccess(event)

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createError({
      statusCode: 400,
      message: '現場IDが指定されていません',
    })
  }

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: { settings: true },
  })

  if (!site) {
    throw createError({
      statusCode: 404,
      message: '指定された現場が見つかりません',
    })
  }

  const rawPath = site.settings?.excelPath

  if (!rawPath) {
    throw createError({
      statusCode: 404,
      message: '現場設定にExcelファイルパスが設定されていません',
    })
  }

  const safePath = validateSafeExcelPath(rawPath)

  if (!fs.existsSync(safePath)) {
    throw createError({
      statusCode: 404,
      message: `設定されたExcelファイルが存在しません: ${safePath}`,
    })
  }

  const ext = path.extname(safePath).toLowerCase()
  const isXlsm = ext === '.xlsm'
  const contentType = isXlsm
    ? 'application/vnd.ms-excel.sheet.macroEnabled.12'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

  const buffer = await fs.promises.readFile(safePath)
  const filename = encodeURIComponent(path.basename(safePath))

  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Content-Disposition', `attachment; filename*=UTF-8''${filename}`)
  setHeader(event, 'X-Excel-Extension', ext)

  return buffer
})
