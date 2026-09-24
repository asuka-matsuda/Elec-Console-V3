import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { usePhase1Exam } from '../../app/composables/portal/phase/usePhase1Exam'
import { usePhase2Exam } from '../../app/composables/portal/phase/usePhase2Exam'
import { usePhase3Exam } from '../../app/composables/portal/phase/usePhase3Exam'
import { usePhaseExamBase } from '../../app/composables/portal/phase/usePhaseExamBase'
import type { CircuitItem } from '../../app/types/souden'

// モック
vi.mock('../../app/composables/useAuth', () => ({
  useAuth: () => ({
    getAccurateNow: () => new Date('2026-09-15T12:00:00.000Z'),
    currentUser: ref({
      loginId: 'worker-1',
      firstName: '太郎',
      lastName: '山田',
    }),
  }),
}))

vi.mock('../../app/composables/portal/useOfflineSync', () => ({
  useOfflineSync: () => ({
    enqueue: vi.fn(),
  }),
}))

describe('usePhaseExamBase', () => {
  it('初期値が正しく設定されること', () => {
    const base = usePhaseExamBase('site-1', '幹線', 1)

    expect(base.selectedKeiTo.value).toBe('幹線')
    expect(base.selectedBanShubetsu.value).toBe('ALL')
    expect(base.selectedBanMeisho.value).toBe('ALL')
    expect(base.circuits.value).toEqual([])
    expect(base.isLoading.value).toBe(false)
  })

  it('isThreePhase が三相・動力を正しく識別すること', () => {
    const base = usePhaseExamBase('site-1', '幹線', 1)

    const threePhaseCircuit: CircuitItem = {
      id: 'c1',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '動力',
      banMeisho: '1P-1',
      haidenHoushiki: '3φ3W 200V',
      p1Kakunin: false,
      p1Mashishime: false,
      p2IsComplete: false,
    }

    const singlePhaseCircuit: CircuitItem = {
      id: 'c2',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '電灯',
      banMeisho: '1L-1',
      haidenHoushiki: '1φ3W 100/200V',
      p1Kakunin: false,
      p1Mashishime: false,
      p2IsComplete: false,
    }

    expect(base.isThreePhase(threePhaseCircuit)).toBe(true)
    expect(base.isThreePhase(singlePhaseCircuit)).toBe(false)
  })

  it('isCircuitLocked が二次側回路の幹線未完了時に true を返すこと', () => {
    const base = usePhaseExamBase('site-1', '二次側', 1)

    base.panelsWithIncompleteKansen.value = ['1L-1']

    const lockedCircuit: CircuitItem = {
      id: 'c1',
      siteId: 'site-1',
      keiTo: '二次側',
      banShubetsu: '電灯',
      banMeisho: '1L-1',
      p1Kakunin: false,
      p1Mashishime: false,
      p2IsComplete: false,
    }

    const unlockedCircuit: CircuitItem = {
      id: 'c2',
      siteId: 'site-1',
      keiTo: '二次側',
      banShubetsu: '電灯',
      banMeisho: '1L-2',
      p1Kakunin: false,
      p1Mashishime: false,
      p2IsComplete: false,
    }

    expect(base.isCircuitLocked(lockedCircuit)).toBe(true)
    expect(base.isCircuitLocked(unlockedCircuit)).toBe(false)
  })

  it('phaseStats が完了数と除外数を正しく集計すること', () => {
    const base = usePhaseExamBase('site-1', '幹線', 1)

    base.circuits.value = [
      {
        id: 'c1',
        siteId: 'site-1',
        keiTo: '幹線',
        banShubetsu: '電灯',
        banMeisho: '1L-1',
        p1Kakunin: true,
        p1Mashishime: true,
        p1ConfirmedAt: '2026-09-01T00:00:00Z',
        p2IsComplete: false,
      },
      {
        id: 'c2',
        siteId: 'site-1',
        keiTo: '幹線',
        banShubetsu: '電灯',
        banMeisho: '1L-1',
        p1Kakunin: false,
        p1Mashishime: false,
        p2IsComplete: false,
      },
      {
        id: 'c3',
        siteId: 'site-1',
        keiTo: '幹線',
        banShubetsu: '電灯',
        banMeisho: '1L-1',
        p1Kakunin: false,
        p1Mashishime: false,
        p2IsComplete: false,
        isExcluded: true,
      },
    ]

    const stats = base.phaseStats.value

    expect(stats.allCount).toBe(3)
    expect(stats.total).toBe(2) // 除外を除いた分母
    expect(stats.completed).toBe(1)
    expect(stats.excluded).toBe(1)
    expect(stats.pct).toBe(50)
  })
})

describe('usePhase1Exam', () => {
  it('フェーズ1用のアクションが正しく提供されること', () => {
    const exam1 = usePhase1Exam('site-1')

    expect(typeof exam1.confirmPhase1).toBe('function')
    expect(exam1.phaseNumber).toBe(1)
  })
})

describe('usePhase2Exam', () => {
  it('evalMegStatus が基準値に応じて正しく判定すること', () => {
    const exam2 = usePhase2Exam('site-1')

    exam2.phase2ThresholdMegOhm.value = 1.0

    expect(exam2.evalMegStatus(100)).toBe('OK')
    expect(exam2.evalMegStatus(1.0)).toBe('OK')
    expect(exam2.evalMegStatus(0.99)).toBe('NG')
    expect(exam2.evalMegStatus(null)).toBeNull()
    expect(exam2.evalMegStatus('')).toBeNull()
  })
})

describe('usePhase3Exam', () => {
  it('フェーズ3用のアクションが正しく提供されること', () => {
    const exam3 = usePhase3Exam('site-1')

    expect(typeof exam3.confirmPhase3).toBe('function')
    expect(typeof exam3.clearPhase3).toBe('function')
    expect(typeof exam3.batchConfirmPhase3).toBe('function')
    expect(exam3.phaseNumber).toBe(3)
  })
})
