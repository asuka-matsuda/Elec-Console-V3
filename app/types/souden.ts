/**
 * 送電試験回路アイテムエンティティ
 * 現場の単線結線図・分電盤図に基づく各回路の属性およびフェーズ1〜3の試験進捗・測定値
 */
export interface CircuitItem {
  /** 回路固有ID (UUID) */
  id: string
  /** 所属現場ID */
  siteId: string
  /** Excel台帳上の行番号 */
  excelRow?: number | null
  /** 回路状態（使用中・予備等） */
  joutai?: string | null
  /** 系統種別（幹線・二次等） */
  keiTo: string
  /** 盤種別（高圧盤・動力盤・電灯盤等） */
  banShubetsu: string
  /** 盤名称 */
  banMeisho: string
  /** 配電方式（単相3線式・三相3線式等） */
  haidenHoushiki?: string | null
  /** 相種別 */
  souShubetsu?: string | null
  /** 回路記号（L-1, P-2等） */
  kairoKigou?: string | null
  /** 回路番号 */
  kairoBangou?: string | null
  /** 回路名称・負荷名称 */
  kairoMeisho?: string | null
  /** 遮断器種別 (MCB, ELB等) */
  shadankiShubetsu?: string | null
  /** 遮断器定格容量 (A/AF/AT) */
  shadankiYouryou?: string | null
  /** 敷設ケーブル品種・条長 */
  cableList?: string | null
  /** 配線条数 */
  haisenJousuu?: string | null
  /** 接地の有無 */
  setsuchiUmu?: string | null
  /** 接機種別・接地線情報 */
  setsuchiList?: string | null

  // --- フェーズ1: 自主検査 ---
  /** フェーズ1: 外観・配線確認チェック完了フラグ */
  p1Kakunin: boolean
  /** フェーズ1: 端子増し締めチェック完了フラグ */
  p1Mashishime: boolean
  /** フェーズ1: 施工・確認担当作業員名 */
  p1Worker?: string | null
  /** フェーズ1: 確定日時 (ISO文字列) */
  p1ConfirmedAt?: string | null
  /** フェーズ1: 特記事項・備考 */
  p1Remarks?: string | null
  /** フェーズ1: 手動変更されたフィールドのJSON記録 */
  p1ModifiedFields?: string | null

  // --- フェーズ2: 耐電圧・絶縁抵抗測定 ---
  /** フェーズ2: R相絶縁抵抗値 (MΩ) */
  zetsuenR?: number | null
  /** フェーズ2: S相絶縁抵抗値 (MΩ) */
  zetsuenS?: number | null
  /** フェーズ2: T相絶縁抵抗値 (MΩ) */
  zetsuenT?: number | null
  /** フェーズ2: R相判定結果 ('pass' | 'fail' 等) */
  p2RStatus?: string | null
  /** フェーズ2: S相判定結果 */
  p2SStatus?: string | null
  /** フェーズ2: T相判定結果 */
  p2TStatus?: string | null
  /** フェーズ2: 試験担当員名 */
  p2Worker?: string | null
  /** フェーズ2: 確定日時 (ISO文字列) */
  p2ConfirmedAt?: string | null
  /** フェーズ2: 備考 */
  p2Remarks?: string | null
  /** フェーズ2: 全相判定合格・試験完了フラグ */
  p2IsComplete: boolean

  // --- フェーズ3: 送電・検相・電圧測定 ---
  /** フェーズ3: 線間電圧 R-S (または R-N) (V) */
  denatsuRs?: number | null
  /** フェーズ3: 線間電圧 S-T (または T-N) (V) */
  denatsuSt?: number | null
  /** フェーズ3: 線間電圧 R-T (または R-T) (V) */
  denatsuRt?: number | null
  /** フェーズ3: 検相結果 ('正相', '点灯確認(良)' 等) */
  kensou?: string | null
  /** フェーズ3: 送電・測定担当員名 */
  p3Worker?: string | null
  /** フェーズ3: 確定日時 (ISO文字列) */
  p3ConfirmedAt?: string | null
  /** フェーズ3: 備考 */
  p3Remarks?: string | null

  /** 試験除外フラグ */
  isExcluded?: boolean
  /** 登録日時 */
  createdAt?: string
  /** 更新日時 */
  updatedAt?: string
  /** 楽観ロック用バージョン番号 */
  version?: number

  [key: string]: unknown
}

/**
 * 各試験フェーズの集計カウント
 */
export interface PhaseStats {
  /** 全登録数 */
  allCount: number
  /** 完了数 */
  completed: number
  /** 試験対象数（除外除く） */
  total: number
  /** 除外数 */
  excluded: number
  /** 進捗率 (0〜100%) */
  pct: number
}

/**
 * 盤選択セレクトボックス用オプション
 */
export interface PanelOption {
  banShubetsu: string
  banMeisho: string
}

/**
 * 回路一覧APIレスポンス
 */
export interface CircuitsResponse {
  circuits: CircuitItem[]
  panelOptions: PanelOption[]
  panelsWithIncompleteKansen: string[]
  phase2ThresholdMegOhm?: number
  total: number
}

/**
 * 現場操作監査ログアイテム
 */
export interface OperationLogItem {
  id: string
  siteId: string
  timestamp: string
  worker: string
  action: string
  targetBan?: string | null
  targetKairo?: string | null
  details?: string | null
}

/**
 * 操作ログ一覧APIレスポンス
 */
export interface OperationLogsResponse {
  logs: OperationLogItem[]
  availableWorkers: string[]
  availableActions: string[]
  availableTargetBans: string[]
  total: number
}
