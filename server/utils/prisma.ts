import path from 'node:path'
import process from 'node:process'

import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const dbPath = path.resolve(process.cwd(), 'prisma/dev.db').replace(/\\/g, '/')

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
