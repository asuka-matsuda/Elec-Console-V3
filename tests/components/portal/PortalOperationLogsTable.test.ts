import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OperationLogsTable from '../../../app/components/portal/organisms/OperationLogsTable.vue'
import { getActionBadgeId } from '../../../app/constants/soudenConstants'
import type { OperationLogItem } from '../../../app/types/souden'

describe('getActionBadgeId', () => {
  it('returns log:success for completion or confirmation actions', () => {
    expect(getActionBadgeId('フェーズ1 確定')).toBe('log:success')
    expect(getActionBadgeId('作業完了')).toBe('log:success')
  })

  it('returns log:danger for cancellation or deletion actions', () => {
    expect(getActionBadgeId('フェーズ1 解除')).toBe('log:danger')
    expect(getActionBadgeId('データ削除')).toBe('log:danger')
  })

  it('returns log:accent for update, modification, or import actions', () => {
    expect(getActionBadgeId('回路情報 更新')).toBe('log:accent')
    expect(getActionBadgeId('設定変更')).toBe('log:accent')
    expect(getActionBadgeId('Excelインポート')).toBe('log:accent')
  })

  it('returns log:neutral for unknown or neutral actions', () => {
    expect(getActionBadgeId('閲覧')).toBe('log:neutral')
    expect(getActionBadgeId(null)).toBe('log:neutral')
    expect(getActionBadgeId(undefined)).toBe('log:neutral')
  })
})

describe('OperationLogsTable.vue', () => {
  const mockLogs: OperationLogItem[] = [
    {
      id: 'log-1',
      siteId: 'site-1',
      timestamp: '2026-09-21T10:30:45Z',
      worker: '山田太郎',
      action: 'フェーズ1 確定',
      targetBan: '1L-1',
      targetKairo: 'L-1',
      details: '接続確認・増締完了',
    },
    {
      id: 'log-2',
      siteId: 'site-1',
      timestamp: '2026-09-21T11:00:00Z',
      worker: '佐藤次郎',
      action: 'フェーズ2 解除',
      targetBan: '2L-1',
      targetKairo: null,
      details: null,
    },
  ]

  it('renders table with action badge slot correctly', () => {
    const wrapper = mount(OperationLogsTable, {
      props: {
        logs: mockLogs,
        isLoading: false,
      },
      global: {
        stubs: {
          Table: {
            props: ['data', 'columns', 'loading'],
            template: `
              <div class="stub-table" :data-loading="loading">
                <div v-for="(row, idx) in data" :key="idx" class="stub-row">
                  <slot name="cell-action" :value="row.action" />
                </div>
              </div>
            `,
          },
          Badge: {
            props: ['id'],
            template: '<span class="stub-badge" :data-badge-id="id"><slot /></span>',
          },
          EmptyState: {
            props: ['icon', 'title', 'description'],
            template: '<div class="stub-empty">{{ title }}</div>',
          },
        },
      },
    })

    const badges = wrapper.findAll('.stub-badge')

    expect(badges.length).toBe(2)
    expect(badges[0]?.attributes('data-badge-id')).toBe('log:success')
    expect(badges[0]?.text()).toBe('フェーズ1 確定')
    expect(badges[1]?.attributes('data-badge-id')).toBe('log:danger')
    expect(badges[1]?.text()).toBe('フェーズ2 解除')
  })

  it('passes isLoading prop to Table component', () => {
    const wrapper = mount(OperationLogsTable, {
      props: {
        logs: [],
        isLoading: true,
      },
      global: {
        stubs: {
          Table: {
            props: ['loading'],
            template: '<div class="stub-table" :data-loading="loading" />',
          },
          Badge: true,
          EmptyState: true,
        },
      },
    })

    const table = wrapper.find('.stub-table')

    expect(table.attributes('data-loading')).toBe('true')
  })
})
