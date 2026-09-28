/**
 * 計算履歴削除 API
 * DELETE /api/calc-history
 *
 * @description 指定したIDの計算履歴、またはツール別の全履歴を削除します。
 */

import { defineEventHandler, getQuery } from 'h3'

import { getAuthUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event)
  const query = getQuery(event)
  const id = query.id as string | undefined
  const toolId = query.toolId as string | undefined

  const settingKey = `calc_history_${user?.loginId || 'shared'}`

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: settingKey },
    })

    if (!setting?.value) {
      return { success: true }
    }

    let currentList = JSON.parse(setting.value) as Array<{ id: string, toolId?: string }>

    if (id) {
      currentList = currentList.filter(item => item.id !== id)
    }
    else if (toolId) {
      currentList = currentList.filter(item => item.toolId !== toolId)
    }
    else {
      currentList = []
    }

    await prisma.systemSetting.update({
      where: { key: settingKey },
      data: { value: JSON.stringify(currentList) },
    })

    return { success: true }
  }
  catch (error) {
    console.error('Failed to delete calc-history:', error)

    return {
      success: false,
      error: '計算履歴の削除に失敗しました。',
    }
  }
})
