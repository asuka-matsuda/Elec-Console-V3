import { describe, expect, it } from 'vitest'

import type { User } from '../../app/types/auth'
import {
  getAssignedWorkerNames,
  getSiteStatusColor,
  getSiteStatusLabel,
} from '../../app/utils/portal'
import {
  getPhase2Threshold,
  isPhase1Complete,
  isPhase2Complete,
  isPhase3Complete,
  isPhaseComplete,
} from '../../app/utils/souden'

describe('portal utils', () => {
  describe('getSiteStatusLabel', () => {
    it('should return Japanese label for each status', () => {
      expect(getSiteStatusLabel('planning')).toBe('計画中')
      expect(getSiteStatusLabel('in_progress')).toBe('進行中')
      expect(getSiteStatusLabel('completed')).toBe('完了')
      expect(getSiteStatusLabel('on_hold')).toBe('保留')
      expect(getSiteStatusLabel('unknown')).toBe('不明')
    })
  })

  describe('getSiteStatusColor', () => {
    it('should return corresponding BadgeColor for each status', () => {
      expect(getSiteStatusColor('planning')).toBe('var(--color-text-muted)')
      expect(getSiteStatusColor('in_progress')).toBe('var(--color-status-warning)')
      expect(getSiteStatusColor('completed')).toBe('var(--color-status-success)')
      expect(getSiteStatusColor('on_hold')).toBe('var(--color-status-danger)')
      expect(getSiteStatusColor('unknown')).toBe('var(--color-text-muted)')
    })
  })

  describe('getAssignedWorkerNames', () => {
    const mockUsers: User[] = [
      {
        id: 'u1',
        loginId: 'user1',
        firstName: '太郎',
        lastName: '山田',
        role: 'worker',
        assignedSiteIds: ['site-1', 'site-2'],
      },
      {
        id: 'u2',
        loginId: 'user2',
        firstName: '花子',
        lastName: '佐藤',
        role: 'worker',
        assignedSiteIds: ['site-2'],
      },
      {
        id: 'u3',
        loginId: 'user3',
        firstName: '次郎',
        lastName: '鈴木',
        role: 'admin',
        assignedSiteIds: [],
      },
    ]

    it('should return worker names assigned to site', () => {
      expect(getAssignedWorkerNames('site-1', mockUsers)).toEqual(['山田 太郎'])
      expect(getAssignedWorkerNames('site-2', mockUsers)).toEqual([
        '山田 太郎',
        '佐藤 花子',
      ])
      expect(getAssignedWorkerNames('site-3', mockUsers)).toEqual([])
    })

    it('should handle null/undefined safely', () => {
      expect(getAssignedWorkerNames(null, mockUsers)).toEqual([])
      expect(getAssignedWorkerNames('site-1', null)).toEqual([])
    })
  })
  describe('getPhase2Threshold', () => {
    it('400Vを含む配電方式は0.4MΩ以上と判定すること', () => {
      expect(getPhase2Threshold('3φ3W 400V')).toBe(0.4)
      expect(getPhase2Threshold('3φ4W 415V')).toBe(0.4)
      expect(getPhase2Threshold('400V動力')).toBe(0.4)
    })

    it('200Vを含む配電方式（100Vを含まない）は0.2MΩ以上と判定すること', () => {
      expect(getPhase2Threshold('3φ3W 200V')).toBe(0.2)
      expect(getPhase2Threshold('3相3線 200V')).toBe(0.2)
    })

    it('100Vまたは100/200V単相3線を含む配電方式は0.1MΩ以上と判定すること', () => {
      expect(getPhase2Threshold('1φ3W 100/200V')).toBe(0.1)
      expect(getPhase2Threshold('単相2線 100V')).toBe(0.1)
      expect(getPhase2Threshold('100V')).toBe(0.1)
    })

    it('未指定または該当なしの場合はデフォルト0.1MΩを返すこと', () => {
      expect(getPhase2Threshold(null)).toBe(0.1)
      expect(getPhase2Threshold('')).toBe(0.1)
      expect(getPhase2Threshold('その他')).toBe(0.1)
    })
  })

  describe('isPhaseComplete helpers', () => {
    it('isPhase1Complete: p1ConfirmedAt, p1Kakunin, p1Mashishime がすべて揃っている場合のみ true', () => {
      expect(isPhase1Complete({ p1ConfirmedAt: '2026-09-25T00:00:00Z', p1Kakunin: true, p1Mashishime: true })).toBe(true)
      expect(isPhase1Complete({ p1ConfirmedAt: null, p1Kakunin: true, p1Mashishime: true })).toBe(false)
      expect(isPhase1Complete({ p1ConfirmedAt: '2026-09-25T00:00:00Z', p1Kakunin: false, p1Mashishime: true })).toBe(false)
      expect(isPhase1Complete({ p1ConfirmedAt: '2026-09-25T00:00:00Z', p1Kakunin: true, p1Mashishime: false })).toBe(false)
    })

    it('isPhase2Complete: p2ConfirmedAt と p2IsComplete が true の場合のみ true', () => {
      expect(isPhase2Complete({ p2ConfirmedAt: '2026-09-25T00:00:00Z', p2IsComplete: true })).toBe(true)
      expect(isPhase2Complete({ p2ConfirmedAt: null, p2IsComplete: true })).toBe(false)
      expect(isPhase2Complete({ p2ConfirmedAt: '2026-09-25T00:00:00Z', p2IsComplete: false })).toBe(false)
    })

    it('isPhase3Complete: p3ConfirmedAt と p3IsComplete が true の場合のみ true', () => {
      expect(isPhase3Complete({ p3ConfirmedAt: '2026-09-25T00:00:00Z', p3IsComplete: true })).toBe(true)
      expect(isPhase3Complete({ p3ConfirmedAt: null, p3IsComplete: true })).toBe(false)
      expect(isPhase3Complete({ p3ConfirmedAt: '2026-09-25T00:00:00Z', p3IsComplete: false })).toBe(false)
    })

    it('isPhaseComplete: フェーズ番号に応じた判定をディスパッチすること', () => {
      const c = {
        p1ConfirmedAt: '2026-09-25T00:00:00Z',
        p1Kakunin: true,
        p1Mashishime: true,
        p2ConfirmedAt: null,
        p2IsComplete: false,
      }

      expect(isPhaseComplete(c, 1)).toBe(true)
      expect(isPhaseComplete(c, 2)).toBe(false)
      expect(isPhaseComplete(c, 99)).toBe(false)
    })
  })
})
