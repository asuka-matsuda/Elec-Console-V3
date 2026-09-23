import { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

describe('Sites CRUD & Cascade Operations', () => {
  const prisma = new PrismaClient()
  const testSiteId = 'test-site-auto-01'
  const renamedSiteId = 'test-site-auto-renamed'

  const safeDelete = async (id: string) => {
    try {
      await prisma.site.delete({ where: { id } })
    }
    catch {
      // 存在しない場合は無視
    }
  }

  beforeAll(async () => {
    await safeDelete(testSiteId)
    await safeDelete(renamedSiteId)
  })

  afterAll(async () => {
    await safeDelete(testSiteId)
    await safeDelete(renamedSiteId)
    await prisma.$disconnect()
  })

  it('creates site with specified custom ID and creates associated settings', async () => {
    const site = await prisma.site.create({
      data: {
        id: testSiteId,
        name: '自動テスト用現場',
        status: 'planning',
      },
    })

    expect(site.id).toBe(testSiteId)
    expect(site.name).toBe('自動テスト用現場')

    const settings = await prisma.siteSettings.create({
      data: {
        siteId: site.id,
        excelPath: '/path/to/test.xlsx',
        phase2ThresholdMegOhm: 1.0,
      },
    })

    expect(settings.siteId).toBe(testSiteId)
  })

  it('updates site ID and cascades to siteSettings', async () => {
    const updated = await prisma.site.update({
      where: { id: testSiteId },
      data: {
        id: renamedSiteId,
        name: '自動テスト用現場（改名後）',
      },
    })

    expect(updated.id).toBe(renamedSiteId)
    expect(updated.name).toBe('自動テスト用現場（改名後）')

    const setting = await prisma.siteSettings.findUnique({
      where: { siteId: renamedSiteId },
    })

    expect(setting).not.toBeNull()
    expect(setting?.siteId).toBe(renamedSiteId)
    expect(setting?.excelPath).toBe('/path/to/test.xlsx')
  })

  it('deletes site and cascades to delete siteSettings', async () => {
    await prisma.site.delete({
      where: { id: renamedSiteId },
    })

    const site = await prisma.site.findUnique({
      where: { id: renamedSiteId },
    })
    const setting = await prisma.siteSettings.findUnique({
      where: { siteId: renamedSiteId },
    })

    expect(site).toBeNull()
    expect(setting).toBeNull()
  })
})
