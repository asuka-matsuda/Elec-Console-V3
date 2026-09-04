import { describe, expect, it } from 'vitest'

import type { User } from '../../app/types/auth'
import {
  getAssignedWorkerNames,
  getSiteStatusColor,
  getSiteStatusLabel,
} from '../../app/utils/portal'

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
      expect(getSiteStatusColor('planning')).toBe('secondary')
      expect(getSiteStatusColor('in_progress')).toBe('warning')
      expect(getSiteStatusColor('completed')).toBe('success')
      expect(getSiteStatusColor('on_hold')).toBe('danger')
      expect(getSiteStatusColor('unknown')).toBe('secondary')
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
})
