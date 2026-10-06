/**
 * 現場設定のExcel連携テンプレートファイル登録・更新 API
 * POST /api/sites/:siteId/circuits/template
 *
 * @description 現場の回路台帳元Excelファイル（.xlsx または .xlsm）をサーバーへアップロードし、
 * 現場設定（excelPath）に紐付けます。回路データ自体のインポート・再作成は行いません。
 * @permission 現場アクセス権限
 */
import fs from 'node:fs'
import path from 'node:path'

import { createError, defineEventHandler, getHeader, getRouterParam, readMultipartFormData } from 'h3'

import { requireSiteAccess } from '../../../../utils/auth'
import { prisma } from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireSiteAccess(event)

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createError({
      statusCode: 400,
      message: '現場IDが指定されていません',
    })
  }

  const site = await prisma.site.findUnique({
    where: { id: siteId },
  })

  if (!site) {
    throw createError({
      statusCode: 404,
      message: '指定された現場が見つかりません',
    })
  }

  const contentType = getHeader(event, 'content-type') || ''

  if (!contentType.includes('multipart/form-data')) {
    throw createError({
      statusCode: 400,
      message: 'multipart/form-data 形式でファイルをアップロードしてください',
    })
  }

  const formData = await readMultipartFormData(event)
  let uploadedFile: { data: Buffer, filename?: string } | null = null

  if (formData) {
    for (const part of formData) {
      if (part.name === 'file' && part.data) {
        uploadedFile = { data: part.data, filename: part.filename }
      }
    }
  }

  if (!uploadedFile || !uploadedFile.data || uploadedFile.data.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'アップロードするExcelファイルが選択されていません',
    })
  }

  const rawExt = path.extname(uploadedFile.filename || '').toLowerCase()

  if (rawExt !== '.xlsx' && rawExt !== '.xlsm') {
    throw createError({
      statusCode: 400,
      message: 'Excelファイル形式（.xlsx または .xlsm）のみアップロード可能です',
    })
  }

  const storageDir = path.resolve(process.cwd(), '.data', 'templates', siteId)

  await fs.promises.mkdir(storageDir, { recursive: true })

  const baseName = path.basename(uploadedFile.filename || '回路台帳', rawExt).replace(/[\\/:*?"<>|]/g, '_')
  const targetFileName = `${baseName}${rawExt}`
  const targetFilePath = path.join(storageDir, targetFileName)

  await fs.promises.writeFile(targetFilePath, uploadedFile.data)

  await prisma.siteSettings.upsert({
    where: { siteId },
    create: { siteId, excelPath: targetFilePath },
    update: { excelPath: targetFilePath },
  })

  const workerName = `${user.lastName} ${user.firstName}`.trim() || user.loginId

  await prisma.operationLog.create({
    data: {
      siteId,
      worker: workerName,
      action: 'Excelテンプレート登録',
      targetBan: '全体',
      targetKairo: 'テンプレート設定',
      details: `帳票用Excelファイル「${uploadedFile.filename}」をサーバーに登録しました`,
    },
  })

  return {
    success: true,
    filePath: targetFilePath,
    filename: targetFileName,
    message: `Excelファイル「${targetFileName}」を登録しました。`,
  }
})
