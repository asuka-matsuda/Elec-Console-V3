/**
 * 現場情報更新 API
 * PUT /api/sites/:siteId
 *
 * @description 指定された現場の基本情報や設定を更新します。現場IDの変更にも対応します。
 * @permission システム管理者限定
 */

import fs from 'node:fs'
import path from 'node:path'

import { defineEventHandler, getRouterParam, readBody } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { isSuperUser, requireSiteAdmin } from '../../../utils/auth'
import { parseValidDate } from '../../../utils/date'
import { createAppError } from '../../../utils/error'
import { validateSafeExcelPath } from '../../../utils/excel/safePath'
import {
  parseAssignedReports,
  parseExcludedCircuits,
  serializeAssignedReports,
  serializeExcludedCircuits,
} from '../../../utils/jsonFields'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: '現場IDが指定されていません。',
    })
  }

  const user = await requireSiteAdmin(event, siteId)

  const existingSite = await prisma.site.findUnique({
    where: { id: siteId },
    include: { settings: true },
  })

  if (!existingSite) {
    throw createAppError({
      code: ErrorCode.SITE_NOT_FOUND,
      message: '更新対象の現場が見つかりません。',
    })
  }

  const body = await readBody(event)
  const siteData = body?.site || body || {}

  // 1. 現場IDの変更および無効化状態の変更は master のみ許可 (A1)
  const newId = typeof siteData.id === 'string' && siteData.id.trim().length > 0
    ? siteData.id.trim()
    : siteId
  const isRenamingSiteId = newId !== siteId

  if (isRenamingSiteId) {
    if (!isSuperUser(user)) {
      throw createAppError({
        code: ErrorCode.AUTH_FORBIDDEN_ACTION,
        message: '現場IDの変更はマスター管理者のみ実行できます。',
      })
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(newId)) {
      throw createAppError({
        code: ErrorCode.SYS_VALIDATION_FAILED,
        message: '現場IDは半角英数字、ハイフン（-）、アンダースコア（_）のみ使用できます。',
      })
    }

    const duplicate = await prisma.site.findUnique({
      where: { id: newId },
    })

    if (duplicate) {
      throw createAppError({
        code: ErrorCode.DB_UNIQUE_VIOLATION,
        message: `現場ID「${newId}」は既に使用されています。別のIDを指定してください。`,
      })
    }
  }

  if (siteData.disabledAt !== undefined && !isSuperUser(user)) {
    throw createAppError({
      code: ErrorCode.AUTH_FORBIDDEN_ACTION,
      message: '現場の有効・無効の切り替えはマスター管理者のみ実行できます。',
    })
  }

  // 2. 現場基本情報の更新データ構築
  const updateData: {
    id?: string
    name?: string
    status?: string
    disabledAt?: Date | null
  } = {
    name: siteData.name !== undefined ? String(siteData.name).trim() : undefined,
    status: siteData.status !== undefined ? String(siteData.status) : undefined,
    disabledAt: siteData.disabledAt !== undefined
      ? (siteData.disabledAt ? (parseValidDate(siteData.disabledAt) || new Date()) : null)
      : undefined,
  }

  if (isRenamingSiteId) {
    updateData.id = newId
  }

  // 3. 現場設定（Excelパス、除外回路ルール、帳票割り当て等）の更新データ構築
  const rawExcelPath = siteData.excelPath !== undefined
    ? siteData.excelPath
    : body?.settings?.excelPath

  let newExcelPath = typeof rawExcelPath === 'string'
    ? rawExcelPath.trim().replace(/^["']+|["']+$/g, '').trim()
    : rawExcelPath

  // 現場ID変更時に既存のテンプレートディレクトリ内パスを参照していた場合は新IDパスへ追従
  const oldTemplateDir = path.resolve(process.cwd(), '.data', 'templates', siteId)
  const newTemplateDir = path.resolve(process.cwd(), '.data', 'templates', newId)

  if (isRenamingSiteId && newExcelPath === undefined && existingSite.settings?.excelPath) {
    const resolvedExisting = path.resolve(existingSite.settings.excelPath)

    if (resolvedExisting.startsWith(oldTemplateDir + path.sep)) {
      newExcelPath = path.join(newTemplateDir, path.relative(oldTemplateDir, resolvedExisting))
    }
  }
  else if (isRenamingSiteId && typeof newExcelPath === 'string' && newExcelPath.length > 0) {
    const resolvedInput = path.resolve(newExcelPath)

    if (resolvedInput.startsWith(oldTemplateDir + path.sep)) {
      newExcelPath = path.join(newTemplateDir, path.relative(oldTemplateDir, resolvedInput))
    }
  }

  if (typeof newExcelPath === 'string' && newExcelPath.length > 0) {
    try {
      newExcelPath = validateSafeExcelPath(newExcelPath, newId)
    }
    catch (pathErr: unknown) {
      throw createAppError({
        code: ErrorCode.SYS_VALIDATION_FAILED,
        statusCode: 400,
        message: pathErr instanceof Error ? pathErr.message : '無効なExcelファイルパスです',
      })
    }
  }

  const rawExcluded = siteData.excludedCircuits !== undefined
    ? siteData.excludedCircuits
    : body?.settings?.excludedCircuits

  const rawAssignedReports = siteData.assignedReports !== undefined
    ? siteData.assignedReports
    : body?.settings?.assignedReports

  const settingsUpdates: Record<string, unknown> = {}

  if (newExcelPath !== undefined) settingsUpdates.excelPath = newExcelPath
  if (rawExcluded !== undefined) settingsUpdates.excludedCircuits = serializeExcludedCircuits(rawExcluded)
  if (rawAssignedReports !== undefined) settingsUpdates.assignedReports = serializeAssignedReports(rawAssignedReports)
  if (body?.settings?.enablePhase3 !== undefined) {
    settingsUpdates.enablePhase3 = Boolean(body.settings.enablePhase3)
  }

  const { updatedSite, settings } = await prisma.$transaction(async (tx) => {
    const site = await tx.site.update({
      where: { id: siteId },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            loginId: true,
            firstName: true,
            lastName: true,
            firstNameKana: true,
            lastNameKana: true,
            role: true,
            isActive: true,
          },
        },
      },
    })

    const currentSiteId = site.id

    const updatedSettings = Object.keys(settingsUpdates).length > 0
      ? await tx.siteSettings.upsert({
          where: { siteId: currentSiteId },
          create: {
            siteId: currentSiteId,
            ...settingsUpdates,
          },
          update: settingsUpdates,
        })
      : await tx.siteSettings.findUnique({
          where: { siteId: currentSiteId },
        })

    return { updatedSite: site, settings: updatedSettings }
  })

  if (isRenamingSiteId && fs.existsSync(oldTemplateDir)) {
    fs.mkdirSync(path.dirname(newTemplateDir), { recursive: true })
    if (fs.existsSync(newTemplateDir)) {
      fs.rmSync(newTemplateDir, { recursive: true, force: true })
    }
    fs.renameSync(oldTemplateDir, newTemplateDir)
  }

  const returnedSite = {
    ...updatedSite,
    excelPath: settings?.excelPath || undefined,
    excludedCircuits: parseExcludedCircuits(settings?.excludedCircuits),
    assignedReports: parseAssignedReports(settings?.assignedReports),
  }

  return { site: returnedSite, settings }
})
