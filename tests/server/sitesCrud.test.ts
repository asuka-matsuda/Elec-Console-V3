import fs from 'node:fs'
import path from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import deleteSiteHandler from '../../server/api/sites/[siteId]/index.delete'
import updateSiteHandler from '../../server/api/sites/[siteId]/index.put'
import getSitesHandler from '../../server/api/sites/index.get'
import createSiteHandler from '../../server/api/sites/index.post'
import { hashPassword } from '../../server/utils/password'
import { prisma } from '../../server/utils/prisma'
import { ErrorCode } from '../../shared/types/errors'
import { createTestH3Event } from '../helpers/h3TestHelper'

describe('Sites CRUD API Handlers & Cascade Operations', () => {
  const testSiteId = 'test-site-api-01'
  const renamedSiteId = 'test-site-api-renamed'
  const disabledSiteId = 'test-site-api-disabled'

  let masterUser: { id: string, loginId: string, role: string, password: string }
  let siteAdminUser: { id: string, loginId: string, role: string, password: string }
  let siteWorkerUser: { id: string, loginId: string, role: string, password: string }

  const cleanupSite = async (id: string) => {
    try {
      await prisma.todo.deleteMany({ where: { siteId: id } })
      await prisma.userOnSite.deleteMany({ where: { siteId: id } })
      await prisma.siteSettings.deleteMany({ where: { siteId: id } })
      await prisma.site.delete({ where: { id } })
    }
    catch {
      // ignore if not exists
    }
    const dir = path.resolve(process.cwd(), '.data', 'templates', id)

    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  }

  beforeAll(async () => {
    await cleanupSite(testSiteId)
    await cleanupSite(renamedSiteId)
    await cleanupSite(disabledSiteId)
    await prisma.user.deleteMany({
      where: { loginId: { in: ['test_sites_admin', 'test_sites_worker'] } },
    })

    // Ensure master user exists
    const existingMaster = await prisma.user.findUnique({ where: { loginId: 'master' } })

    if (existingMaster) {
      masterUser = existingMaster
    }
    else {
      masterUser = await prisma.user.create({
        data: {
          loginId: 'master',
          password: hashPassword('masterpass123'),
          firstName: '飛鳥',
          lastName: '松田',
          role: 'master',
          isActive: true,
          requirePasswordReset: false,
        },
      })
    }

    siteAdminUser = await prisma.user.create({
      data: {
        loginId: 'test_sites_admin',
        password: hashPassword('adminpass123'),
        firstName: '太郎',
        lastName: '現場管理',
        role: 'worker',
        isActive: true,
        requirePasswordReset: false,
      },
    })

    siteWorkerUser = await prisma.user.create({
      data: {
        loginId: 'test_sites_worker',
        password: hashPassword('workerpass123'),
        firstName: '次郎',
        lastName: '作業員',
        role: 'worker',
        isActive: true,
        requirePasswordReset: false,
      },
    })
  })

  afterAll(async () => {
    await cleanupSite(testSiteId)
    await cleanupSite(renamedSiteId)
    await cleanupSite(disabledSiteId)
    await prisma.user.deleteMany({
      where: { loginId: { in: ['test_sites_admin', 'test_sites_worker'] } },
    })
  })

  it('POST /api/sites rejects non-master users with 403 and validates ID format', async () => {
    // Non-master user blocked
    const forbiddenEvent = createTestH3Event({
      method: 'POST',
      user: siteAdminUser,
      body: { id: testSiteId, name: '不正作成現場' },
    })

    await expect(createSiteHandler(forbiddenEvent)).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: ErrorCode.AUTH_FORBIDDEN_ACTION,
    })

    // Invalid ID characters rejected with 400
    const invalidIdEvent = createTestH3Event({
      method: 'POST',
      user: masterUser,
      body: { id: 'invalid site/id!', name: '不正ID現場' },
    })

    await expect(createSiteHandler(invalidIdEvent)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: ErrorCode.SYS_VALIDATION_FAILED,
    })
  })

  it('POST /api/sites creates site + settings atomically for master and rejects duplicate ID with 409', async () => {
    const createEvent = createTestH3Event({
      method: 'POST',
      user: masterUser,
      body: { id: testSiteId, name: '自動テスト現場', status: 'active' },
    })
    const res = await createSiteHandler(createEvent)

    expect(res.site.id).toBe(testSiteId)
    expect(res.site.name).toBe('自動テスト現場')
    expect(res.site.users).toEqual([])
    expect(res.settings.siteId).toBe(testSiteId)
    expect(res.settings.enablePhase3).toBe(true)

    // Duplicate ID -> 409 DB_UNIQUE_VIOLATION
    const dupEvent = createTestH3Event({
      method: 'POST',
      user: masterUser,
      body: { id: testSiteId, name: '重複現場' },
    })

    await expect(createSiteHandler(dupEvent)).rejects.toMatchObject({
      statusCode: 409,
      statusMessage: ErrorCode.DB_UNIQUE_VIOLATION,
    })
  })

  it('PUT /api/sites/:siteId allows site admin to update settings (including empty assignedReports) but blocks ID rename and disabledAt changes', async () => {
    // Assign siteAdminUser as admin and siteWorkerUser as worker on testSiteId
    await prisma.user.update({
      where: { id: siteAdminUser.id },
      data: { assignedSites: { connect: [{ id: testSiteId }] } },
    })
    await prisma.userOnSite.create({
      data: { userId: siteAdminUser.id, siteId: testSiteId, role: 'admin' },
    })
    await prisma.user.update({
      where: { id: siteWorkerUser.id },
      data: { assignedSites: { connect: [{ id: testSiteId }] } },
    })
    await prisma.userOnSite.create({
      data: { userId: siteWorkerUser.id, siteId: testSiteId, role: 'worker' },
    })

    // Worker cannot update site settings -> 403
    const workerUpdateEvent = createTestH3Event({
      method: 'PUT',
      user: siteWorkerUser,
      params: { siteId: testSiteId },
      body: { name: '作業員変更' },
    })

    await expect(updateSiteHandler(workerUpdateEvent)).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: ErrorCode.AUTH_FORBIDDEN_ACTION,
    })

    // Site admin cannot rename site ID -> 403
    const adminRenameEvent = createTestH3Event({
      method: 'PUT',
      user: siteAdminUser,
      params: { siteId: testSiteId },
      body: { id: renamedSiteId, name: 'ID変更試行' },
    })

    await expect(updateSiteHandler(adminRenameEvent)).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: ErrorCode.AUTH_FORBIDDEN_ACTION,
    })

    // Site admin cannot toggle disabledAt -> 403
    const adminDisableEvent = createTestH3Event({
      method: 'PUT',
      user: siteAdminUser,
      params: { siteId: testSiteId },
      body: { disabledAt: new Date().toISOString() },
    })

    await expect(updateSiteHandler(adminDisableEvent)).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: ErrorCode.AUTH_FORBIDDEN_ACTION,
    })

    // Site admin CAN update site name, excludedCircuits, and empty assignedReports: []
    const adminUpdateEvent = createTestH3Event({
      method: 'PUT',
      user: siteAdminUser,
      params: { siteId: testSiteId },
      body: {
        name: '管理者更新現場',
        excludedCircuits: ['予備', '欠番', '予備'],
        assignedReports: [],
      },
    })
    const updatedRes = await updateSiteHandler(adminUpdateEvent)

    expect(updatedRes.site.name).toBe('管理者更新現場')
    expect(updatedRes.site.excludedCircuits).toEqual(['予備', '欠番'])
    // Empty array must be preserved as [] and NOT fall back to default 4 reports
    expect(updatedRes.site.assignedReports).toEqual([])
    // Returned site must include assigned users array
    expect(Array.isArray(updatedRes.site.users)).toBe(true)
    expect(updatedRes.site.users.length).toBe(2)
  })

  it('PUT /api/sites/:siteId by master renames site ID and cascades to UserOnSite, Todo, SiteSettings, and .data/templates directory', async () => {
    // Create a Todo and a template file under testSiteId
    await prisma.todo.create({
      data: {
        id: 'todo-cascade-rename-1',
        siteId: testSiteId,
        userId: siteAdminUser.loginId,
        text: 'ID変更カスケード確認',
        completed: false,
      },
    })
    const oldTemplateDir = path.resolve(process.cwd(), '.data', 'templates', testSiteId)

    fs.mkdirSync(oldTemplateDir, { recursive: true })
    const oldExcelFile = path.join(oldTemplateDir, 'ledger.xlsx')

    fs.writeFileSync(oldExcelFile, 'dummy')
    await prisma.siteSettings.update({
      where: { siteId: testSiteId },
      data: { excelPath: oldExcelFile },
    })

    const masterRenameEvent = createTestH3Event({
      method: 'PUT',
      user: masterUser,
      params: { siteId: testSiteId },
      body: {
        id: renamedSiteId,
        name: '改名後テスト現場',
      },
    })
    const res = await updateSiteHandler(masterRenameEvent)

    expect(res.site.id).toBe(renamedSiteId)
    expect(res.site.name).toBe('改名後テスト現場')

    // Verify UserOnSite cascaded
    const uos = await prisma.userOnSite.findMany({ where: { siteId: renamedSiteId } })

    expect(uos.length).toBe(2)

    // Verify Todo cascaded
    const todo = await prisma.todo.findUnique({ where: { id: 'todo-cascade-rename-1' } })

    expect(todo?.siteId).toBe(renamedSiteId)

    // Verify .data/templates directory renamed and excelPath updated
    const newTemplateDir = path.resolve(process.cwd(), '.data', 'templates', renamedSiteId)

    expect(fs.existsSync(oldTemplateDir)).toBe(false)
    expect(fs.existsSync(path.join(newTemplateDir, 'ledger.xlsx'))).toBe(true)
    expect(res.site.excelPath).toBe(path.join(newTemplateDir, 'ledger.xlsx'))
  })

  it('GET /api/sites filters out disabled sites for non-master users while master can still see them', async () => {
    // Create a second site and assign siteAdminUser to it, then disable it as master
    await createSiteHandler(createTestH3Event({
      method: 'POST',
      user: masterUser,
      body: { id: disabledSiteId, name: '無効化テスト現場' },
    }))
    await prisma.user.update({
      where: { id: siteAdminUser.id },
      data: { assignedSites: { connect: [{ id: disabledSiteId }] } },
    })
    await prisma.userOnSite.create({
      data: { userId: siteAdminUser.id, siteId: disabledSiteId, role: 'admin' },
    })

    await updateSiteHandler(createTestH3Event({
      method: 'PUT',
      user: masterUser,
      params: { siteId: disabledSiteId },
      body: { disabledAt: new Date().toISOString() },
    }))

    // Non-master user only sees active assigned sites
    const adminListRes = await getSitesHandler(createTestH3Event({
      method: 'GET',
      user: siteAdminUser,
    }))
    const adminSiteIds = adminListRes.sites.map(s => s.id)

    expect(adminSiteIds).toContain(renamedSiteId)
    expect(adminSiteIds).not.toContain(disabledSiteId)

    // Master sees both active and disabled sites
    const masterListRes = await getSitesHandler(createTestH3Event({
      method: 'GET',
      user: masterUser,
    }))
    const masterSiteIds = masterListRes.sites.map(s => s.id)

    expect(masterSiteIds).toContain(renamedSiteId)
    expect(masterSiteIds).toContain(disabledSiteId)

    // Non-master user attempting to PUT disabled site is blocked with 403 AUTH_FORBIDDEN_ACTION
    await expect(updateSiteHandler(createTestH3Event({
      method: 'PUT',
      user: siteAdminUser,
      params: { siteId: disabledSiteId },
      body: { name: '無効化現場の更新試行' },
    }))).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: ErrorCode.AUTH_FORBIDDEN_ACTION,
    })
  })

  it('DELETE /api/sites/:siteId deletes site, all related DB records, and .data/templates directory', async () => {
    const deleteEvent = createTestH3Event({
      method: 'DELETE',
      user: masterUser,
      params: { siteId: renamedSiteId },
    })
    const res = await deleteSiteHandler(deleteEvent)

    expect(res.success).toBe(true)

    expect(await prisma.site.findUnique({ where: { id: renamedSiteId } })).toBeNull()
    expect(await prisma.siteSettings.findUnique({ where: { siteId: renamedSiteId } })).toBeNull()
    expect(await prisma.todo.count({ where: { siteId: renamedSiteId } })).toBe(0)
    expect(await prisma.userOnSite.count({ where: { siteId: renamedSiteId } })).toBe(0)
    expect(fs.existsSync(path.resolve(process.cwd(), '.data', 'templates', renamedSiteId))).toBe(false)
  })
})
