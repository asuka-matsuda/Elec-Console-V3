import type { SelectOption, TableColumn } from '~/types/components'
import type { CircuitItem, OperationLogItem } from '~/types/souden'

/**
 * フェーズ1：回路確認・増し締め テーブルカラム定義
 */
export const PHASE1_TABLE_COLUMNS: TableColumn<CircuitItem>[] = [
  { key: 'banMeisho', label: '盤情報', sortable: true, width: '95px' },
  { key: 'kairoBangou', label: '回路番号', sortable: true, width: '80px', align: 'center' },
  { key: 'kairoMeisho', label: '回路名称', sortable: true, width: '135px' },
  { key: 'cableList', label: '配線 / 接地', sortable: true, width: '130px' },
  { key: 'p1Kakunin', label: '確認 / 増締め', sortable: true, width: '115px', align: 'center' },
  { key: 'p1Remarks', label: '備考', sortable: true },
  { key: 'actions', label: '操作', width: '125px', align: 'center' },
  { key: 'p1ConfirmedAt', label: '測定者 / 日時', sortable: true, width: '115px', align: 'center' },
]

/**
 * フェーズ2：絶縁抵抗測定 テーブルカラム定義
 */
export const PHASE2_TABLE_COLUMNS: TableColumn<CircuitItem>[] = [
  { key: 'banMeisho', label: '盤情報', sortable: true, width: '95px' },
  { key: 'kairoBangou', label: '回路番号', sortable: true, width: '80px', align: 'center' },
  { key: 'kairoMeisho', label: '回路名称', sortable: true, width: '135px' },
  { key: 'zetsuenR', label: '測定1', sortable: true, width: '100px', align: 'center' },
  { key: 'zetsuenS', label: '測定2', sortable: true, width: '100px', align: 'center' },
  { key: 'zetsuenT', label: '測定3', sortable: true, width: '100px', align: 'center' },
  { key: 'p2Remarks', label: '備考', sortable: true },
  { key: 'actions', label: '操作', width: '125px', align: 'center' },
  { key: 'p2ConfirmedAt', label: '測定者 / 日時', sortable: true, width: '110px', align: 'center' },
]

/**
 * フェーズ3：送電・電圧測定 テーブルカラム定義
 */
export const PHASE3_TABLE_COLUMNS: TableColumn<CircuitItem>[] = [
  { key: 'banMeisho', label: '盤情報', sortable: true, width: '95px' },
  { key: 'kairoBangou', label: '回路番号', sortable: true, width: '80px', align: 'center' },
  { key: 'kairoMeisho', label: '回路名称', sortable: true, width: '135px' },
  { key: 'denatsuRs', label: '電圧1', sortable: true, width: '75px', align: 'center' },
  { key: 'denatsuSt', label: '電圧2', sortable: true, width: '75px', align: 'center' },
  { key: 'denatsuRt', label: '電圧3', sortable: true, width: '75px', align: 'center' },
  { key: 'kensou', label: '検相 / 点灯', sortable: true, width: '100px', align: 'center' },
  { key: 'p3Remarks', label: '備考', sortable: true },
  { key: 'actions', label: '操作', width: '125px', align: 'center' },
  { key: 'p3ConfirmedAt', label: '測定者 / 日時', sortable: true, width: '115px', align: 'center' },
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
 * 送電試験 操作ログ テーブルカラム定義
 */
export const OPERATION_LOG_COLUMNS: TableColumn<OperationLogItem>[] = [
  { key: 'timestamp', label: '日時', width: '170px' },
  { key: 'worker', label: '作業者', width: '120px' },
  { key: 'action', label: 'アクション', width: '140px', align: 'center' },
  { key: 'targetBan', label: '対象盤', width: '130px' },
  { key: 'targetKairo', label: '対象回路', width: '140px' },
  { key: 'details', label: '詳細内容' },
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
