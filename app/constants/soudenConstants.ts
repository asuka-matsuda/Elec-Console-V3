/**
 * 送電試験テーブル定義定数
 *
 * Phase 1〜3 の試験テーブル表示用カラム定義および系統（幹線・動力・電灯等）区分を提供します。
 */

import type { CircuitItem } from '#shared/types/circuit'
import type { OperationLogItem } from '#shared/types/operationLog'
import type { BadgeVariant, SelectOption, TableColumn } from '~/types/components'
import { formatDateTime } from '~/utils/date'

/**
 * フェーズ1：回路確認・増締 テーブルカラム定義
 */
export const PHASE1_TABLE_COLUMNS: TableColumn<CircuitItem>[] = [
  { key: 'banMeisho', label: '盤情報', width: '150px' },
  { key: 'kairoBangou', label: '回路番号', align: 'center', width: '90px' },
  { key: 'kairoMeisho', label: '回路名称' },
  { key: 'shadankiShubetsu', label: '遮断機種別', align: 'center', width: '110px' },
  { key: 'cableList', label: '配線 / 接地', width: '150px' },
  { key: 'p1Kakunin', label: 'サイズ確認 / 増締', align: 'center', width: '150px' },
  { key: 'p1Remarks', label: '備考' },
  { key: 'actions', label: '操作', sortable: false, align: 'center', width: '120px' },
  { key: 'p1ConfirmedAt', label: '測定者 / 日時', align: 'center', width: '140px' },
]

/**
 * フェーズ2：絶縁抵抗測定 テーブルカラム定義
 */
export const PHASE2_TABLE_COLUMNS: TableColumn<CircuitItem>[] = [
  { key: 'banMeisho', label: '盤情報', width: '150px' },
  { key: 'kairoBangou', label: '回路番号', align: 'center', width: '90px' },
  { key: 'kairoMeisho', label: '回路名称' },
  { key: 'zetsuenR', label: '測定1', align: 'center', width: '90px' },
  { key: 'zetsuenS', label: '測定2', align: 'center', width: '90px' },
  { key: 'zetsuenT', label: '測定3', align: 'center', width: '90px' },
  { key: 'p2Remarks', label: '備考' },
  { key: 'actions', label: '操作', sortable: false, align: 'center', width: '120px' },
  { key: 'p2ConfirmedAt', label: '測定者 / 日時', align: 'center', width: '140px' },
]

/**
 * フェーズ3：送電・電圧測定 テーブルカラム定義
 */
export const PHASE3_TABLE_COLUMNS: TableColumn<CircuitItem>[] = [
  { key: 'banMeisho', label: '盤情報', width: '150px' },
  { key: 'kairoBangou', label: '回路番号', align: 'center', width: '90px' },
  { key: 'kairoMeisho', label: '回路名称' },
  { key: 'denatsuRs', label: '電圧1', align: 'center', width: '90px' },
  { key: 'denatsuSt', label: '電圧2', align: 'center', width: '90px' },
  { key: 'denatsuRt', label: '電圧3', align: 'center', width: '90px' },
  { key: 'kensou', label: '検相 / 点灯', align: 'center', width: '110px' },
  { key: 'p3Remarks', label: '備考' },
  { key: 'actions', label: '操作', sortable: false, align: 'center', width: '120px' },
  { key: 'p3ConfirmedAt', label: '測定者 / 日時', align: 'center', width: '140px' },
]

/**
 * 三相（動力）検相オプション（正 / 逆）
 */
export const KENSOU_OPTIONS_3P: SelectOption[] = [
  { label: '正', value: '正' },
  { label: '逆', value: '逆' },
]

/**
 * 単相（電灯）点灯確認オプション（良 / 否）
 */
export const KENSOU_OPTIONS_1P: SelectOption[] = [
  { label: '良', value: '良' },
  { label: '否', value: '否' },
]

/**
 * 送電試験 操作ログのアクション文字列からバッジ色を判定する
 */
export const getActionBadgeColor = (action: unknown): string => {
  if (typeof action !== 'string') return 'var(--color-status-neutral)'
  if (action.includes('確定') || action.includes('完了')) {
    return 'var(--color-status-success)'
  }
  if (action.includes('解除') || action.includes('削除')) {
    return 'var(--color-status-danger)'
  }
  if (action.includes('更新') || action.includes('変更') || action.includes('インポート')) {
    return 'var(--theme-accent)'
  }

  return 'var(--color-status-neutral)'
}

/**
 * 送電試験 操作ログのアクション文字列からバッジバリアントを判定する（Geist準拠）
 */
export const getActionBadgeVariant = (action: unknown): BadgeVariant => {
  if (typeof action !== 'string') return 'gray'
  if (action.includes('確定') || action.includes('完了')) {
    return 'green'
  }
  if (action.includes('解除') || action.includes('削除')) {
    return 'red'
  }
  if (action.includes('更新') || action.includes('変更') || action.includes('インポート')) {
    return 'blue'
  }

  return 'gray'
}

/**
 * 送電試験 操作ログ テーブルカラム定義
 */
export const OPERATION_LOG_COLUMNS: TableColumn<OperationLogItem>[] = [
  {
    key: 'timestamp',
    label: '日時',
    width: '170px',
    align: 'center',
    format: val => formatDateTime(val, '-', { withSeconds: true }),
  },
  { key: 'worker', label: '作業者', width: '120px' },
  { key: 'action', label: 'アクション', width: '140px', align: 'center' },
  { key: 'targetBan', label: '対象盤', width: '130px' },
  { key: 'targetKairo', label: '対象回路', width: '140px', align: 'center' },
  { key: 'details', label: '詳細内容', truncate: true },
]

/**
 * 送電試験 操作ログ 表示件数オプション
 */
export const OPERATION_LOG_LIMIT_OPTIONS = [
  { label: '最新 50 件', value: 50 },
  { label: '最新 100 件', value: 100 },
  { label: '最新 200 件', value: 200 },
  { label: 'すべて表示', value: 0 },
]

/**
 * 送電試験 フェーズ切替ナビゲーション項目定義
 */
export const PHASE_NAV_OPTIONS = [
  { label: 'フェーズ1：回路確認・増締', value: '1' },
  { label: 'フェーズ2：絶縁抵抗測定', value: '2' },
  { label: 'フェーズ3：送電・電圧測定・検相', value: '3' },
] as const
