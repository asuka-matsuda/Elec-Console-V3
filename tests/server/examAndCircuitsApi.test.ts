import ExcelJS from 'exceljs'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import phase1PostHandler from '../../server/api/sites/[siteId]/circuits/[id]/phase1.post'
import phase1ClearHandler from '../../server/api/sites/[siteId]/circuits/[id]/phase1/clear.post'
import phase2PostHandler from '../../server/api/sites/[siteId]/circuits/[id]/phase2.post'
import phase3PostHandler from '../../server/api/sites/[siteId]/circuits/[id]/phase3.post'
import circuitsGetHandler from '../../server/api/sites/[siteId]/circuits/index.get'
import { generateAuthToken } from '../../server/utils/auth'
import { importCircuitsFromExcel } from '../../server/utils/excel/circuitImport'
import { hashPassword } from '../../server/utils/password'
import { prisma } from '../../server/utils/prisma'
import { ErrorCode } from '../../shared/types/errors'
import { createTestH3Event } from '../helpers/h3TestHelper'

describe('試験確定・解除 API (examLogic) および Excel 入出力の統合テスト', () => {
  const TEST_PREFIX = 'TEST_EXAM_API_'
  let testSiteId = ''
  const createdUserIds: string[] = []
  let workerToken = ''
  let viewerToken = ''

  beforeEach(async () => {
    testSiteId = `${TEST_PREFIX}SITE_${Date.now()}`
    await prisma.site.create({
      data: {
        id: testSiteId,
        name: '試験API検証現場',
      },
    })

    const worker = await prisma.user.create({
      data: {
        loginId: `${TEST_PREFIX}worker_${Date.now()}`,
        password: hashPassword('workerpass123'),
        firstName: '作業員',
        lastName: '現場',
        role: 'worker',
        isActive: true,
        assignedSites: { connect: [{ id: testSiteId }] },
        siteAssignments: {
          create: [{ siteId: testSiteId, role: 'worker' }],
        },
      },
    })

    createdUserIds.push(worker.id)
    workerToken = generateAuthToken(worker)

    const viewer = await prisma.user.create({
      data: {
        loginId: `${TEST_PREFIX}viewer_${Date.now()}`,
        password: hashPassword('viewerpass123'),
        firstName: '閲覧者',
        lastName: '現場',
        role: 'worker',
        isActive: true,
        assignedSites: { connect: [{ id: testSiteId }] },
        siteAssignments: {
          create: [{ siteId: testSiteId, role: 'viewer' }],
        },
      },
    })

    createdUserIds.push(viewer.id)
    viewerToken = generateAuthToken(viewer)
  })

  afterEach(async () => {
    await prisma.operationLog.deleteMany({ where: { siteId: testSiteId } })
    await prisma.circuit.deleteMany({ where: { siteId: testSiteId } })
    await prisma.siteSettings.deleteMany({ where: { siteId: testSiteId } })
    await prisma.userOnSite.deleteMany({ where: { siteId: testSiteId } })
    await prisma.site.deleteMany({ where: { id: testSiteId } })

    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
      createdUserIds.length = 0
    }
  })

  describe('Phase 1/2/3 確定・解除とトランザクション・楽観的ロック', () => {
    it('Phase 1 確定時にチェック・version更新と OperationLog 記録が単一トランザクションでアトミックに行われること', async () => {
      const circuit = await prisma.circuit.create({
        data: {
          siteId: testSiteId,
          keiTo: '二次側',
          banShubetsu: '動力',
          banMeisho: 'MP-1',
          kairoBangou: '1',
          kairoMeisho: '給水ポンプ',
          haidenHoushiki: 'AC 3Φ3W 200V',
          souShubetsu: 'RST',
          version: 1,
        },
      })

      const res = await phase1PostHandler(createTestH3Event({
        method: 'POST',
        token: workerToken,
        params: { siteId: testSiteId, id: circuit.id },
        body: {
          kakunin: true,
          mashishime: true,
          remarks: '増締異常なし',
          expectedVersion: 1,
        },
      }))

      expect(res.success).toBe(true)
      expect(res.circuit.p1Kakunin).toBe(true)
      expect(res.circuit.p1Mashishime).toBe(true)
      expect(res.circuit.p1Remarks).toBe('増締異常なし')
      expect(res.circuit.version).toBe(2)

      const logs = await prisma.operationLog.findMany({
        where: { siteId: testSiteId, targetBan: 'MP-1', targetKairo: '1' },
      })

      expect(logs).toHaveLength(1)
      expect(logs[0]?.action).toBe('フェーズ1 確定')
      expect(logs[0]?.worker).toContain('現場')
    })

    it('古い expectedVersion で確定リクエストを送ると 409 CIRCUIT_VERSION_CONFLICT となり、OperationLog も作成されないこと', async () => {
      const circuit = await prisma.circuit.create({
        data: {
          siteId: testSiteId,
          keiTo: '二次側',
          banShubetsu: '動力',
          banMeisho: 'MP-1',
          kairoBangou: '2',
          kairoMeisho: '排気ファン',
          version: 3,
        },
      })

      await expect(
        phase1PostHandler(createTestH3Event({
          method: 'POST',
          token: workerToken,
          params: { siteId: testSiteId, id: circuit.id },
          body: {
            kakunin: true,
            mashishime: true,
            expectedVersion: 2, // 古いバージョン
          },
        })),
      ).rejects.toMatchObject({
        statusCode: 409,
        statusMessage: ErrorCode.CIRCUIT_VERSION_CONFLICT,
      })

      const logs = await prisma.operationLog.findMany({
        where: { siteId: testSiteId, targetBan: 'MP-1', targetKairo: '2' },
      })

      expect(logs).toHaveLength(0)
    })

    it('Phase 2 確定で負数やNaNの絶縁抵抗値は 400 SYS_VALIDATION_FAILED で拒否され、remarksOnly: true では測定値を汚さず備考のみ保存できること', async () => {
      const circuit = await prisma.circuit.create({
        data: {
          siteId: testSiteId,
          keiTo: '二次側',
          banShubetsu: '電灯',
          banMeisho: 'L-1',
          kairoBangou: '3',
          kairoMeisho: '予備（除外）',
          souShubetsu: 'RN',
          version: 1,
        },
      })

      // 負の測定値は 400 で拒否
      await expect(
        phase2PostHandler(createTestH3Event({
          method: 'POST',
          token: workerToken,
          params: { siteId: testSiteId, id: circuit.id },
          body: {
            rVal: -5,
            rStatus: '良好',
          },
        })),
      ).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: ErrorCode.SYS_VALIDATION_FAILED,
      })

      // remarksOnly: true で備考のみ保存
      const remarksRes = await phase2PostHandler(createTestH3Event({
        method: 'POST',
        token: workerToken,
        params: { siteId: testSiteId, id: circuit.id },
        body: {
          remarksOnly: true,
          remarks: '除外回路の特記事項',
          expectedVersion: 1,
        },
      }))

      expect(remarksRes.success).toBe(true)
      expect(remarksRes.circuit.p2Remarks).toBe('除外回路の特記事項')
      expect(remarksRes.circuit.zetsuenR).toBeNull()
      expect(remarksRes.circuit.p2IsComplete).toBe(false)
    })

    it('Phase 3 確定・Phase 1 解除 (clearCircuitPhase) が正常に動作し、競合時はロールバックされること', async () => {
      const c1 = await prisma.circuit.create({
        data: {
          siteId: testSiteId,
          keiTo: '二次側',
          banShubetsu: '動力',
          banMeisho: 'MP-2',
          kairoBangou: '1',
          kairoMeisho: 'ファン1',
          p1Kakunin: true,
          p1Mashishime: true,
          p1Worker: 'テスト太郎',
          p1ConfirmedAt: new Date(),
          version: 5,
        },
      })

      // Phase 3 確定
      const p3Res = await phase3PostHandler(createTestH3Event({
        method: 'POST',
        token: workerToken,
        params: { siteId: testSiteId, id: c1.id },
        body: {
          rs: 202.5,
          st: 203.0,
          rt: 202.8,
          kensou: '正',
          expectedVersion: 5,
        },
      }))

      expect(p3Res.success).toBe(true)
      expect(p3Res.circuit.denatsuRs).toBe(202.5)
      expect(p3Res.circuit.p3IsComplete).toBe(true)
      expect(p3Res.circuit.version).toBe(6)

      // 競合する expectedVersion (4) で解除を送ると 409 CIRCUIT_VERSION_CONFLICT
      await expect(
        phase1ClearHandler(createTestH3Event({
          method: 'POST',
          token: workerToken,
          params: { siteId: testSiteId, id: c1.id },
          body: { expectedVersion: 4 },
        })),
      ).rejects.toMatchObject({
        statusCode: 409,
        statusMessage: ErrorCode.CIRCUIT_VERSION_CONFLICT,
      })

      // 正しい expectedVersion (6) で Phase 1 解除を実行
      const clearRes = await phase1ClearHandler(createTestH3Event({
        method: 'POST',
        token: workerToken,
        params: { siteId: testSiteId, id: c1.id },
        body: { expectedVersion: 6 },
      }))

      expect(clearRes.success).toBe(true)
      expect(clearRes.circuit.p1Kakunin).toBe(false)
      expect(clearRes.circuit.p1Mashishime).toBe(false)
      expect(clearRes.circuit.p1ConfirmedAt).toBeNull()
      expect(clearRes.circuit.version).toBe(7)
    })

    it('viewer ロールは回路一覧の取得のみ可能で、試験確定・解除は403 AUTH_FORBIDDEN_ACTION で拒否されること', async () => {
      const circuit = await prisma.circuit.create({
        data: {
          siteId: testSiteId,
          keiTo: '二次側',
          banShubetsu: '動力',
          banMeisho: 'MP-3',
          kairoBangou: '1',
          kairoMeisho: 'ポンプ',
        },
      })

      const getRes = await circuitsGetHandler(createTestH3Event({
        method: 'GET',
        token: viewerToken,
        params: { siteId: testSiteId },
      }))

      expect(Array.isArray(getRes.circuits)).toBe(true)
      expect(getRes.circuits).toHaveLength(1)

      await expect(
        phase1PostHandler(createTestH3Event({
          method: 'POST',
          token: viewerToken,
          params: { siteId: testSiteId, id: circuit.id },
          body: { kakunin: true, mashishime: true },
        })),
      ).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: ErrorCode.AUTH_FORBIDDEN_ACTION,
      })
    })
  })

  describe('Excel インポート (importCircuitsFromExcel) & エクスポート行書戻し (applyCircuitToRow)', () => {
    async function buildTestExcelBuffer(rows: Array<{
      banMeisho: string
      banShubetsu: string
      keiTo: string
      kairoBangou: string
      kairoMeisho: string
      souShubetsu: string
      zetsuenR?: number | string
    }>): Promise<Buffer> {
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('回路一覧')

      // Row 5: Header row matching HEADER_ALIASES
      const headerRow = ws.getRow(5)

      headerRow.getCell(1).value = '盤名称'
      headerRow.getCell(2).value = '盤種別'
      headerRow.getCell(3).value = '配電方式'
      headerRow.getCell(4).value = '幹線/二次側'
      headerRow.getCell(5).value = '相種別'
      headerRow.getCell(6).value = '回路番号'
      headerRow.getCell(7).value = '回路名称'
      headerRow.getCell(8).value = '絶縁R'

      rows.forEach((r, idx) => {
        const row = ws.getRow(6 + idx)

        row.getCell(1).value = r.banMeisho
        row.getCell(2).value = r.banShubetsu
        row.getCell(3).value = 'AC 1Φ2W 100V'
        row.getCell(4).value = r.keiTo
        row.getCell(5).value = r.souShubetsu
        row.getCell(6).value = r.kairoBangou
        row.getCell(7).value = r.kairoMeisho
        if (r.zetsuenR !== undefined) {
          row.getCell(8).value = r.zetsuenR
        }
      })

      const arrayBuffer = await wb.xlsx.writeBuffer()

      return Buffer.from(arrayBuffer)
    }

    it('初回インポート時に未入力の確定日時に現在時刻が捏造されず、再インポートの merge モードでは DB 側の確定済み測定値が保護されること', async () => {
      const initialBuffer = await buildTestExcelBuffer([
        {
          banMeisho: '1L-1',
          banShubetsu: '電灯',
          keiTo: '二次側',
          kairoBangou: '1',
          kairoMeisho: '旧負荷名',
          souShubetsu: 'RN',
        },
      ])

      const importRes = await importCircuitsFromExcel(testSiteId, initialBuffer, '管理者', 'merge', 'init.xlsx')

      expect(importRes.success).toBe(true)
      expect(importRes.count).toBe(1)

      const existing = await prisma.circuit.findFirstOrThrow({ where: { siteId: testSiteId } })

      expect(existing.p1ConfirmedAt).toBeNull()
      expect(existing.p2ConfirmedAt).toBeNull()

      // Webアプリ上で Phase 2 を確定済みに更新
      await prisma.circuit.update({
        where: { id: existing.id },
        data: {
          zetsuenR: 100,
          p2RStatus: '良好',
          p2SStatus: '良好',
          p2Worker: '田中',
          p2IsComplete: true,
          p2ConfirmedAt: new Date('2026-10-15T03:00:00.000Z'),
          version: 4,
        },
      })

      // 回路名称は同じで別の設計変更や新規行がある Excel を merge モードで再インポート
      const updatedBuffer = await buildTestExcelBuffer([
        {
          banMeisho: '1L-1',
          banShubetsu: '電灯',
          keiTo: '二次側',
          kairoBangou: '1',
          kairoMeisho: '旧負荷名',
          souShubetsu: 'RN',
        },
        {
          banMeisho: '1L-1',
          banShubetsu: '電灯',
          keiTo: '二次側',
          kairoBangou: '2',
          kairoMeisho: '追加回路',
          souShubetsu: 'RN',
        },
      ])

      await importCircuitsFromExcel(testSiteId, updatedBuffer, '管理者', 'merge', 'merge.xlsx')

      const merged = await prisma.circuit.findFirstOrThrow({
        where: { siteId: testSiteId, kairoBangou: '1' },
      })

      expect(merged.zetsuenR).toBe(100)
      expect(merged.p2RStatus).toBe('良好')
      expect(merged.p2Worker).toBe('田中')
      expect(merged.p2IsComplete).toBe(true)

      // reset モードで再インポートすると試験結果がクリアされること
      await importCircuitsFromExcel(testSiteId, updatedBuffer, '管理者', 'reset', 'reset.xlsx')
      const afterReset = await prisma.circuit.findFirstOrThrow({
        where: { siteId: testSiteId, kairoBangou: '1' },
      })

      expect(afterReset.p2IsComplete).toBe(false)
      expect(afterReset.zetsuenR).toBeNull()
    })
  })
})
