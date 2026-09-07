import type { Circuit } from '@prisma/client'
import { describe, expect, it } from 'vitest'

import { checkOptimisticLock } from '../../../server/utils/optimisticLock'

describe('checkOptimisticLock', () => {
  const baseCircuit: Circuit = {
    id: 'circuit-1',
    siteId: 'site-1',
    excelRow: 5,
    joutai: null,
    keiTo: '幹線',
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
    createdAt: new Date('2026-09-01T10:00:00.000Z'),
    updatedAt: new Date('2026-09-01T10:00:00.000Z'),
  }

  it('expectedUpdatedAt が指定されていない場合は例外を投げない（後方互換）', () => {
    expect(() => checkOptimisticLock(baseCircuit, null)).not.toThrow()
    expect(() => checkOptimisticLock(baseCircuit, undefined)).not.toThrow()
  })

  it('expectedUpdatedAt が DB の updatedAt と同時刻（または2秒以内）の場合は例外を投げない', () => {
    // 同時刻
    expect(() => checkOptimisticLock(baseCircuit, '2026-09-01T10:00:00.000Z')).not.toThrow()

    // 1秒差
    expect(() => checkOptimisticLock(baseCircuit, '2026-09-01T10:00:01.000Z')).not.toThrow()
  })

  it('expectedUpdatedAt と DB の updatedAt に2秒以上の乖離がある場合は 409 Conflict をスローする', () => {
    // クライアント側が古いタイムスタンプを保持しているケース (別作業員が既に更新済み)
    expect(() => {
      checkOptimisticLock(baseCircuit, '2026-09-01T09:00:00.000Z')
    }).toThrowError(/他の作業員/)

    try {
      checkOptimisticLock(baseCircuit, '2026-09-01T09:00:00.000Z')
    }
    catch (err: unknown) {
      const e = err as { statusCode: number, data: { currentCircuit: Circuit } }

      expect(e.statusCode).toBe(409)
      expect(e.data.currentCircuit.id).toBe('circuit-1')
    }
  })
})
