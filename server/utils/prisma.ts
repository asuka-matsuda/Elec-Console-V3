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
    // fallback to process.cwd()
  }

  const candidates = [
    path.resolve(process.cwd(), 'prisma/dev.db'),
    path.resolve(currentDir, '../../prisma/dev.db'),
    path.resolve(currentDir, '../../../prisma/dev.db'),
    path.resolve('/root/elec-console/Elec-Console-V3/prisma/dev.db'),
  ]
  const existingPath = candidates.find(p => fs.existsSync(p)) || candidates[0]
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
