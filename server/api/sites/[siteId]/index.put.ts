/**
 * 現場情報更新 API
 * PUT /api/sites/:siteId
 *
 * @description 指定された現場の基本情報や設定を更新します。現場IDの変更にも対応します。
 * @permission システム管理者限定
 */

import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'

import { requireAdminUser } from '../../../utils/auth'
import {
  parseExcludedCircuits,
  parseNoBreakWords,
  serializeExcludedCircuits,
  serializeNoBreakWords,
} from '../../../utils/jsonFields'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const siteId = getRouterParam(event, 'siteId')
  const body = await readBody(event)

  if (!siteId) return null

  const siteData = body.site || body

  // 1. 現場IDの変更チェックとバリデーション
  const newId = typeof siteData.id === 'string' ? siteData.id.trim() : siteId

  if (newId && newId !== siteId) {
    if (!/^[a-zA-Z0-9_-]+$/.test(newId)) {
      throw createError({
        statusCode: 400,
        message: '現場IDは半角英数字、ハイフン（-）、アンダースコア（_）のみ使用できます。',
      })
    }

    const existing = await prisma.site.findUnique({
      where: { id: newId },
    })

    if (existing) {
      throw createError({
        statusCode: 409,
        message: `現場ID「${newId}」は既に使用されています。別のIDを指定してください。`,
      })
    }
  }

  // 2. 現場基本情報の更新 (ID変更がある場合はIDも同時更新)
  const updateData: {
    id?: string
    name?: string
    status?: string
    disabledAt?: Date | null
  } = {
    name: siteData.name,
    status: siteData.status,
    disabledAt: siteData.disabledAt !== undefined
      ? (siteData.disabledAt ? new Date(siteData.disabledAt) : null)
      : undefined,
  }

  if (newId && newId !== siteId) {
    updateData.id = newId
  }

  const updatedSite = await prisma.site.update({
    where: { id: siteId },
    data: updateData,
  })

  const currentSiteId = updatedSite.id

  // 3. 現場設定（Excelパス、除外回路ルール等）の更新
  const rawExcelPath = siteData.excelPath !== undefined
    ? siteData.excelPath
    : body.settings?.excelPath

  const newExcelPath = typeof rawExcelPath === 'string'
    ? rawExcelPath.trim().replace(/^["']+|["']+$/g, '').trim()
    : rawExcelPath

  const rawExcluded = siteData.excludedCircuits !== undefined
    ? siteData.excludedCircuits
    : body.settings?.excludedCircuits

  const rawNoBreak = siteData.noBreakWords !== undefined
    ? siteData.noBreakWords
    : body.settings?.noBreakWords

  const settingsUpdates: Record<string, unknown> = {}

  if (newExcelPath !== undefined) settingsUpdates.excelPath = newExcelPath
  if (rawExcluded !== undefined) settingsUpdates.excludedCircuits = serializeExcludedCircuits(rawExcluded)
  if (rawNoBreak !== undefined) settingsUpdates.noBreakWords = serializeNoBreakWords(rawNoBreak)
  if (body.settings?.phase2ThresholdMegOhm !== undefined) {
    settingsUpdates.phase2ThresholdMegOhm = body.settings.phase2ThresholdMegOhm
  }
  if (body.settings?.enablePhase3 !== undefined) {
    settingsUpdates.enablePhase3 = body.settings.enablePhase3
  }

  const settings = Object.keys(settingsUpdates).length > 0
    ? await prisma.siteSettings.upsert({
        where: { siteId: currentSiteId },
        create: {
          siteId: currentSiteId,
          ...settingsUpdates,
        },
        update: settingsUpdates,
      })
    : await prisma.siteSettings.findUnique({
        where: { siteId: currentSiteId },
      })

  const returnedSite = {
    ...updatedSite,
    excelPath: settings?.excelPath || undefined,
    excludedCircuits: parseExcludedCircuits(settings?.excludedCircuits),
    noBreakWords: parseNoBreakWords(settings?.noBreakWords),
  }

  return { site: returnedSite, settings }
})
