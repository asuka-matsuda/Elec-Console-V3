import type { Circuit } from '@prisma/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { atomicUpdateCircuit, checkOptimisticLock } from '../../server/utils/optimisticLock'
import { prisma } from '../../server/utils/prisma'
import { ErrorCode } from '../../shared/types/errors'

describe('checkOptimisticLock', () => {
  const baseCircuit: Circuit = {
    id: 'circuit-1',
    siteId: 'site-1',
    excelRow: 5,
    floor: null,
    joutai: null,
    keiTo: '幹線',
    keiToName: null,
    banShubetsu: '電灯',
    banMeisho: '1L-1',
    haidenHoushiki: null,
    souShubetsu: null,
    kairoKigou: null,
    kairoBangou: '1',
    kairoMeisho: '電灯幹線',
    shadankiShubetsu: null,
    shadankiYouryou: null,
    cableList: null,
    haisenJousuu: null,
    setsuchiUmu: null,
    setsuchiList: null,
    p1Kakunin: false,
    p1Mashishime: false,
    p1MashishimeCubicle: false,
    p1Worker: null,
    p1ConfirmedAt: null,
    p1Remarks: null,
    p1ModifiedFields: null,
    zetsuenR: null,
    zetsuenS: null,
    zetsuenT: null,
    p2RStatus: null,
    p2SStatus: null,
    p2TStatus: null,
    p2Worker: null,
    p2ConfirmedAt: null,
    p2Remarks: null,
    p2IsComplete: false,
    denatsuRs: null,
    denatsuSt: null,
    denatsuRt: null,
    kensou: null,
    p3Worker: null,
    p3ConfirmedAt: null,
    p3Remarks: null,
    p3IsComplete: false,
    version: 1,
    createdAt: new Date('2026-09-01T10:00:00.000Z'),
    updatedAt: new Date('2026-09-01T10:00:00.000Z'),
  }

  it('expectedUpdatedAt および expectedVersion が指定されていない場合は例外を投げない', () => {
    expect(() => checkOptimisticLock(baseCircuit, null)).not.toThrow()
    expect(() => checkOptimisticLock(baseCircuit, undefined)).not.toThrow()
  })

  it('expectedUpdatedAt が DB の updatedAt と同時刻（または2秒以内）の場合は例外を投げない', () => {
    expect(() => checkOptimisticLock(baseCircuit, '2026-09-01T10:00:00.000Z')).not.toThrow()
    expect(() => checkOptimisticLock(baseCircuit, '2026-09-01T10:00:01.000Z')).not.toThrow()
  })

  it('expectedUpdatedAt と DB の updatedAt に2秒以上の乖離がある場合は 409 Conflict をスローする', () => {
    expect(() => {
      checkOptimisticLock(baseCircuit, '2026-09-01T09:00:00.000Z')
    }).toThrowError(/他の作業者/)

    try {
      checkOptimisticLock(baseCircuit, '2026-09-01T09:00:00.000Z')
    }
    catch (err: unknown) {
      const e = err as { statusCode: number, data: { currentCircuit: Circuit } }

      expect(e.statusCode).toBe(409)
      expect(e.data.currentCircuit.id).toBe('circuit-1')
    }
  })

  it('expectedVersion が一致する場合は例外を投げない', () => {
    expect(() => checkOptimisticLock(baseCircuit, undefined, 1)).not.toThrow()
    expect(() => checkOptimisticLock(baseCircuit, '2026-09-01T09:00:00.000Z', 1)).not.toThrow()
  })

  it('expectedVersion が不一致の場合は 409 Conflict をスローする', () => {
    expect(() => {
      checkOptimisticLock(baseCircuit, undefined, 0)
    }).toThrowError(/他の作業者/)

    try {
      checkOptimisticLock(baseCircuit, undefined, 0)
    }
    catch (err: unknown) {
      const e = err as { statusCode: number, data: { currentCircuit: Circuit } }

      expect(e.statusCode).toBe(409)
      expect(e.data.currentCircuit.version).toBe(1)
    }
  })
})

describe('atomicUpdateCircuit (CAS 楽観的ロック DB 実証)', () => {
  const testSiteId = `TEST_LOCK_SITE_${Date.now()}`

  beforeEach(async () => {
    await prisma.site.create({
      data: { id: testSiteId, name: 'CASロック検証現場' },
    })
  })

  afterEach(async () => {
    await prisma.circuit.deleteMany({ where: { siteId: testSiteId } })
    await prisma.site.deleteMany({ where: { id: testSiteId } })
  })

  it('expectedVersion が一致する時は更新に成功し version が +1 インクリメントされ、不一致時は 409 となること', async () => {
    const circuit = await prisma.circuit.create({
      data: {
        siteId: testSiteId,
        keiTo: '二次側',
        banShubetsu: '電灯',
        banMeisho: '1L-1',
        kairoBangou: '1',
        kairoMeisho: '照明1',
        version: 1,
      },
    })

    const updated = await atomicUpdateCircuit({
      circuitId: circuit.id,
      siteId: testSiteId,
      expectedVersion: 1,
      data: { p1Kakunin: true },
    })

    expect(updated.p1Kakunin).toBe(true)
    expect(updated.version).toBe(2)

    await expect(
      atomicUpdateCircuit({
        circuitId: circuit.id,
        siteId: testSiteId,
        expectedVersion: 1,
        data: { p1Mashishime: true },
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      statusMessage: ErrorCode.CIRCUIT_VERSION_CONFLICT,
    })
  })

  it('expectedVersion 未指定で expectedUpdatedAt のみ指定されたフォールバック時も CAS が働き、古いタイムスタンプは 409 となること', async () => {
    const circuit = await prisma.circuit.create({
      data: {
        siteId: testSiteId,
        keiTo: '二次側',
        banShubetsu: '電灯',
        banMeisho: '1L-1',
        kairoBangou: '2',
        kairoMeisho: '照明2',
        version: 1,
      },
    })

    const updated = await atomicUpdateCircuit({
      circuitId: circuit.id,
      siteId: testSiteId,
      expectedUpdatedAt: circuit.updatedAt.toISOString(),
      data: { p1Kakunin: true },
    })

    expect(updated.version).toBe(2)

    const staleTimestamp = new Date(circuit.updatedAt.getTime() - 10000).toISOString()

    await expect(
      atomicUpdateCircuit({
        circuitId: circuit.id,
        siteId: testSiteId,
        expectedUpdatedAt: staleTimestamp,
        data: { p1Mashishime: true },
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      statusMessage: ErrorCode.CIRCUIT_VERSION_CONFLICT,
    })
  })
})
