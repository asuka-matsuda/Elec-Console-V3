/**
 * 計算履歴登録 API
 * POST /api/calc-history
 *
 * @description 計算ツールの結果をユーザーの計算履歴としてデータベースに永続化します。
 */

import { randomUUID } from 'node:crypto'

import { defineEventHandler, readBody } from 'h3'

import { getAuthUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event)
  const body = await readBody(event)

  const settingKey = `calc_history_${user?.loginId || 'shared'}`

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: settingKey },
    })

    let currentList: Array<{ id: string, toolId?: string, timestamp?: string }> = []

    if (setting?.value) {
      try {
        currentList = JSON.parse(setting.value)
      }
      catch {
        currentList = []
      }
    }

    const formattedDate = formatDateTime(new Date())

    const newEntry = {
      ...body,
      id: body.id || randomUUID(),
      timestamp: body.timestamp || formattedDate,
    }

    // 先頭に追加し、最大30件に制限
    currentList = [newEntry, ...currentList.filter(item => item.id !== newEntry.id)].slice(0, 30)

    await prisma.systemSetting.upsert({
      where: { key: settingKey },
      update: { value: JSON.stringify(currentList) },
      create: { key: settingKey, value: JSON.stringify(currentList) },
    })

    return {
      success: true,
      entry: newEntry,
    }
  }
  catch (error) {
    console.error('Failed to save calc-history:', error)

    return {
      success: false,
      error: '計算履歴の保存に失敗しました。',
    }
  }
})
