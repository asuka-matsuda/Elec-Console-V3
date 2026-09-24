/**
 * 送電試験テーブル定義定数
 *
 * Phase 1〜3 の試験テーブル表示用カラム定義および系統（幹線・動力・電灯等）区分を提供します。
 */

import type { BadgePresetId, SelectOption, TableColumn } from '~/types/components'
import type { CircuitItem, OperationLogItem } from '~/types/souden'
import { formatDateTime } from '~/utils/date'

/**
 * フェーズ1：回路確認・増締 テーブルカラム定義
 */
export const PHASE1_TABLE_COLUMNS: TableColumn<CircuitItem>[] = [
  { key: 'banMeisho', subKey: 'banShubetsu', label: '盤情報' },
  { key: 'kairoBangou', label: '回路番号', align: 'center' },
  { key: 'kairoMeisho', label: '回路名称' },
  { key: 'cableList', label: '配線 / 接地' },
  { key: 'p1Kakunin', label: 'サイズ確認 / 増締', align: 'center' },
  { key: 'p1Remarks', label: '備考' },
  { key: 'actions', label: '操作', sortable: false, align: 'center' },
  { key: 'p1ConfirmedAt', label: '測定者 / 日時', align: 'center' },
]

/**
 * フェーズ2：絶縁抵抗測定 テーブルカラム定義
 */
export const PHASE2_TABLE_COLUMNS: TableColumn<CircuitItem>[] = [
  { key: 'banMeisho', subKey: 'banShubetsu', label: '盤情報' },
  { key: 'kairoBangou', label: '回路番号', align: 'center' },
  { key: 'kairoMeisho', label: '回路名称' },
  { key: 'zetsuenR', label: '測定1', align: 'center' },
  { key: 'zetsuenS', label: '測定2', align: 'center' },
  { key: 'zetsuenT', label: '測定3', align: 'center' },
  { key: 'p2Remarks', label: '備考' },
  { key: 'actions', label: '操作', sortable: false, align: 'center' },
  { key: 'p2ConfirmedAt', label: '測定者 / 日時', align: 'center' },
]

/**
 * フェーズ3：送電・電圧測定 テーブルカラム定義
 */
export const PHASE3_TABLE_COLUMNS: TableColumn<CircuitItem>[] = [
  { key: 'banMeisho', subKey: 'banShubetsu', label: '盤情報' },
  { key: 'kairoBangou', label: '回路番号', align: 'center' },
  { key: 'kairoMeisho', label: '回路名称' },
  { key: 'denatsuRs', label: '電圧1', align: 'center' },
  { key: 'denatsuSt', label: '電圧2', align: 'center' },
  { key: 'denatsuRt', label: '電圧3', align: 'center' },
  { key: 'kensou', label: '検相 / 点灯', align: 'center' },
  { key: 'p3Remarks', label: '備考' },
  { key: 'actions', label: '操作', sortable: false, align: 'center' },
  { key: 'p3ConfirmedAt', label: '測定者 / 日時', align: 'center' },
]

/**
 * 三相（動力）検相オプション
 */
export const KENSOU_OPTIONS_3P: SelectOption[] = [
  { label: '正相', value: '正相' },
  { label: '逆相', value: '逆相' },
]

/**
 * 単相（電灯）点灯確認オプション
 */
export const KENSOU_OPTIONS_1P: SelectOption[] = [
  { label: '点灯確認(良)', value: '点灯確認(良)' },
  { label: '点灯確認(否)', value: '点灯確認(否)' },
]

/**
 * 送電試験 操作ログのアクション文字列から BadgePresetId を判定する
 */
export const getActionBadgeId = (action: unknown): BadgePresetId => {
  if (typeof action !== 'string') return 'log:neutral'
  if (action.includes('確定') || action.includes('完了')) {
    return 'log:success'
  }
  if (action.includes('解除') || action.includes('削除')) {
    return 'log:danger'
  }
  if (action.includes('更新') || action.includes('変更') || action.includes('インポート')) {
    return 'log:accent'
  }

  return 'log:neutral'
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
