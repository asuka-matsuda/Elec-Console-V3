/**
 * カレンダーイベント登録・編集用フォームデータ
 */
export interface EventFormData {
  /** 予定タイトル */
  title: string
  /** イベント種別 (工程・点検・送電等) */
  type: string
  /** 開始日時 (YYYY-MM-DD または YYYY-MM-DDTHH:mm) */
  start: string
  /** 終了日時 */
  end: string
  /** 終日フラグ */
  allDay: boolean
}

/**
 * 送電試験全体および系統別（幹線・二次）進捗統計
 */
export interface SoudenStats {
  /** 全体総合進捗率 (0〜100%) */
  totalPct: number
  /** 全登録回路総数 */
  totalCircuits: number
  /** 試験対象のアクティブ回路数 */
  totalActive: number
  /** 試験除外回路数 */
  totalExcluded: number
  /** フェーズ1完了件数 */
  p1Total: number
  /** フェーズ2完了件数 */
  p2Total: number
  /** フェーズ3完了件数 */
  p3Total: number

  /** 幹線系統総数 */
  trunkTotal: number
  /** 幹線除外数 */
  trunkExcluded: number
  /** 幹線フェーズ1完了数 */
  trunkP1: number
  /** 幹線フェーズ1進捗率 (%) */
  trunkP1Pct: number
  /** 幹線フェーズ2完了数 */
  trunkP2: number
  /** 幹線フェーズ2進捗率 (%) */
  trunkP2Pct: number
  /** 幹線フェーズ3完了数 */
  trunkP3: number
  /** 幹線フェーズ3進捗率 (%) */
  trunkP3Pct: number
  /** 幹線総合進捗率 (%) */
  trunkOverallPct: number

  /** 二次系統総数 */
  secTotal: number
  /** 二次除外数 */
  secExcluded: number
  /** 二次フェーズ1完了数 */
  secP1: number
  /** 二次フェーズ1進捗率 (%) */
  secP1Pct: number
  /** 二次フェーズ2完了数 */
  secP2: number
  /** 二次フェーズ2進捗率 (%) */
  secP2Pct: number
  /** 二次フェーズ3完了数 */
  secP3: number
  /** 二次フェーズ3進捗率 (%) */
  secP3Pct: number
  /** 二次総合進捗率 (%) */
  secOverallPct: number
}
