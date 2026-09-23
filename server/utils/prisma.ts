/**
 * Prisma Client シングルトン初期化ユーティリティ
 *
 * 開発・本番および各種ランタイム環境において SQLite データベースパスを安全に解決し、
 * PrismaClient の単一インスタンスを管理・提供します。
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  let currentDir = process.cwd()

  try {
    currentDir = path.dirname(fileURLToPath(import.meta.url))
  }
  catch {
    // import.meta.url が解決できない環境では process.cwd() をフォールバックとして使用
  }

  const defaultPath = path.resolve(process.cwd(), 'prisma/dev.db')
  const candidates = [
    defaultPath,
    path.resolve(currentDir, '../../prisma/dev.db'),
    path.resolve(currentDir, '../../../prisma/dev.db'),
    path.resolve('/root/elec-console/Elec-Console-V3/prisma/dev.db'),
  ]
  const existingPath: string = candidates.find(p => fs.existsSync(p)) ?? defaultPath
  const dbPath = existingPath.replace(/\\/g, '/')

  return new PrismaClient({
    datasources: {
      db: {
        url: `file:${dbPath}`,
      },
    },
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
