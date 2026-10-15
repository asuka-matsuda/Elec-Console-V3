import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useNuxtApp } from '#app'
import type { CircuitItem } from '#shared/types/circuit'

import {
  usePhase1Exam,
  usePhase2Exam,
  usePhase3Exam,
  usePhaseExamBase,
} from '../../app/composables/portal/phase/usePhaseExam'

const mockEnqueue = vi.fn()
const mockRemoveQueueItem = vi.fn()

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    getAccurateNow: () => new Date('2026-09-15T12:00:00.000Z'),
    currentUser: ref({
      loginId: 'worker-1',
      firstName: '太郎',
      lastName: '山田',
    }),
  }),
}))

vi.mock('~/composables/portal/useOfflineSync', () => ({
  useOfflineSync: () => ({
    enqueue: mockEnqueue,
    removeQueueItem: mockRemoveQueueItem,
  }),
}))

const mockApi = vi.mocked(useNuxtApp().$api)

describe('usePhaseExamBase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnqueue.mockResolvedValue({ id: 'outbox-1' })
    mockRemoveQueueItem.mockResolvedValue(undefined)
  })

  it('初期値が正しく設定されること', () => {
    const base = usePhaseExamBase('site-1', '幹線', 1)

    expect(base.selectedKeiTo.value).toBe('幹線')
    expect(base.selectedBanShubetsu.value).toBe('ALL')
    expect(base.selectedBanMeisho.value).toBe('ALL')
    expect(base.circuits.value).toEqual([])
    expect(base.isLoading.value).toBe(true)
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
        p1MashishimeCubicle: true,
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

  it('エリア選択肢 (availableFloorList) と選択中エリア (selectedFloor) による盤名称・回路の連動絞込が動作すること', () => {
    const base = usePhaseExamBase('site-1', '幹線', 1)

    base.circuits.value = [
      {
        id: 'c1',
        siteId: 'site-1',
        floor: '東エリア1F',
        keiTo: '幹線',
        banShubetsu: '電灯',
        banMeisho: '1L-1',
        p1Kakunin: false,
        p1Mashishime: false,
        p2IsComplete: false,
      },
      {
        id: 'c2',
        siteId: 'site-1',
        floor: '西エリア2F',
        keiTo: '幹線',
        banShubetsu: '電灯',
        banMeisho: '2L-1',
        p1Kakunin: false,
        p1Mashishime: false,
        p2IsComplete: false,
      },
      {
        id: 'c3',
        siteId: 'site-1',
        floor: null,
        keiTo: '幹線',
        banShubetsu: '電灯',
        banMeisho: 'XL-1',
        p1Kakunin: false,
        p1Mashishime: false,
        p2IsComplete: false,
      },
    ]

    expect(base.availableFloorList.value).toEqual([
      { label: 'すべてのエリア', value: 'ALL' },
      { label: '西エリア2F', value: '西エリア2F' },
      { label: '東エリア1F', value: '東エリア1F' },
      { label: 'エリア未設定', value: '__UNSET__' },
    ])

    base.selectedFloor.value = '東エリア1F'
    expect(base.filteredCircuits.value).toHaveLength(1)
    expect(base.filteredCircuits.value[0]?.id).toBe('c1')
    expect(base.availableBanMeishoList.value).toEqual([
      { label: 'すべての盤', value: 'ALL' },
      { label: '1L-1', value: '1L-1' },
    ])
  })
})

describe('usePhase1Exam / usePhase2Exam / usePhase3Exam (Local-First 実行・競合・ロールバック検証)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnqueue.mockResolvedValue({ id: 'outbox-1' })
    mockRemoveQueueItem.mockResolvedValue(undefined)
  })

  it('confirmPhase1: オンライン成功時に楽観更新・API送信・Outbox削除が行われること', async () => {
    const exam1 = usePhase1Exam('site-1')
    const target: CircuitItem = {
      id: 'c1',
      siteId: 'site-1',
      keiTo: '二次側',
      banShubetsu: '電灯',
      banMeisho: '1L-1',
      kairoBangou: '1',
      kairoMeisho: '照明',
      p1Kakunin: false,
      p1Mashishime: false,
      p2IsComplete: false,
      version: 1,
    }

    exam1.circuits.value = [target]
    mockApi.mockResolvedValueOnce({
      success: true,
      circuit: { ...target, p1Kakunin: true, p1Mashishime: true, version: 2 },
    })

    await exam1.confirmPhase1(target, { kakunin: true, mashishime: true })

    expect(mockEnqueue).toHaveBeenCalledTimes(1)
    expect(mockApi).toHaveBeenCalledWith(
      '/api/sites/site-1/circuits/c1/phase1',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(mockRemoveQueueItem).toHaveBeenCalledWith('outbox-1')
    expect(exam1.circuits.value[0]?.p1Kakunin).toBe(true)
    expect(exam1.circuits.value[0]?.version).toBe(2)
  })

  it('confirmPhase2: オフライン(TypeError Failed to fetch)時は楽観更新を維持し、Outboxにキューを残して正常終了すること', async () => {
    const exam2 = usePhase2Exam('site-1')
    const target: CircuitItem = {
      id: 'c2',
      siteId: 'site-1',
      keiTo: '二次側',
      banShubetsu: '電灯',
      banMeisho: '1L-1',
      souShubetsu: 'RN',
      p1Kakunin: true,
      p1Mashishime: true,
      p2IsComplete: false,
      version: 1,
    }

    exam2.circuits.value = [target]
    mockApi.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const res = await exam2.confirmPhase2(target, { rVal: 100, rStatus: '良好', sStatus: '良好', isComplete: true })

    expect(res).toEqual({ success: true, isOffline: true })
    expect(exam2.circuits.value[0]?.zetsuenR).toBe(100)
    expect(exam2.circuits.value[0]?.p2IsComplete).toBe(true)
    // オフライン時は Outbox から削除しないこと
    expect(mockRemoveQueueItem).not.toHaveBeenCalled()
  })

  it('confirmPhase3: 409 Conflict 発生時はサーバーの最新回路状態に更新し、Outboxから除去して onConflict を呼ぶこと', async () => {
    const onConflict = vi.fn()
    const exam3 = usePhase3Exam('site-1', '幹線', { onConflict })
    const target: CircuitItem = {
      id: 'c3',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '動力',
      banMeisho: '1P-1',
      p1Kakunin: true,
      p1Mashishime: true,
      p2IsComplete: true,
      version: 1,
    }

    exam3.circuits.value = [target]
    const serverCurrent: CircuitItem = {
      ...target,
      denatsuRs: 205,
      kensou: '正',
      p3Worker: '別作業者',
      version: 2,
    }

    mockApi.mockRejectedValueOnce({
      statusCode: 409,
      data: {
        message: '競合エラー',
        data: { currentCircuit: serverCurrent },
      },
    })

    await exam3.confirmPhase3(target, { rs: 200, kensou: '正', isComplete: true })

    expect(onConflict).toHaveBeenCalledWith('競合エラー')
    expect(mockRemoveQueueItem).toHaveBeenCalledWith('outbox-1')
    expect(exam3.circuits.value[0]?.denatsuRs).toBe(205)
    expect(exam3.circuits.value[0]?.p3Worker).toBe('別作業者')
    expect(exam3.circuits.value[0]?.version).toBe(2)
  })

  it('saveExcludedRemarks: 400/500 サーバーエラー発生時は楽観更新を元の状態へロールバックし、Outboxからも除去すること', async () => {
    const onError = vi.fn()
    const exam1 = usePhase1Exam('site-1', '幹線', { onError })
    const target: CircuitItem = {
      id: 'c4',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '電灯',
      banMeisho: '1L-1',
      p1Kakunin: false,
      p1Mashishime: false,
      p1Remarks: '変更前の備考',
      p2IsComplete: false,
      isExcluded: true,
    }

    exam1.circuits.value = [target]
    mockApi.mockRejectedValueOnce(new Error('Validation Error'))

    await expect(exam1.saveExcludedRemarks(target, '不正な備考')).rejects.toThrow('Validation Error')

    // 元の状態にロールバックされていること
    expect(exam1.circuits.value[0]?.p1Remarks).toBe('変更前の備考')
    expect(mockRemoveQueueItem).toHaveBeenCalledWith('outbox-1')
    expect(onError).toHaveBeenCalled()
  })
})
