import { defineEventHandler } from 'h3'

import { prisma } from '../../utils/prisma'

const SETTING_KEY = 'no_break_words'

export default defineEventHandler(async () => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTING_KEY },
    })

    if (!setting || !setting.value) {
      return {
        success: true,
        words: [] as string[],
      }
    }

    const parsed = JSON.parse(setting.value)
    const words = Array.isArray(parsed)
      ? parsed.filter((w): w is string => typeof w === 'string' && w.trim().length > 0)
      : []

    return {
      success: true,
      words,
    }
  }
  catch (error) {
    console.error('Failed to get system no_break_words setting:', error)

    return {
      success: true,
      words: [] as string[],
    }
  }
})
