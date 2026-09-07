import { defineNitroPlugin } from 'nitropack/runtime'

import { prisma } from '../utils/prisma'

export default defineNitroPlugin(async () => {
  try {
    // SQLite の WALモード と 同時書き込みビジータイムアウト（5秒）を適用して並行性能を強化
    await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;')
    await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000;')
    await prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL;')
    console.log('[Database] SQLite WAL mode, busy_timeout (5000ms), and synchronous (NORMAL) enabled.')
  }
  catch (error) {
    console.warn('[Database] Failed to initialize SQLite PRAGMA settings:', error)
  }
})
