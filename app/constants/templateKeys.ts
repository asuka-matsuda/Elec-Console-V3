/**
 * 帳票出力用 テンプレート置換キー共通マスター定義
 *
 * @description システム全体のExcelテンプレート（タグ出力、リモコン設定表、試験成績書等）で
 * 使用可能な %キー名% の統一仕様およびエイリアス（別名）マッピングを提供します。
 */

export type TemplateKeyCategory = 'circuit' | 'remote' | 'cable' | 'meta'

export interface TemplateKeyCategoryMeta {
  id: TemplateKeyCategory
  label: string
  description: string
  icon: string
}

export const TEMPLATE_KEY_CATEGORIES: TemplateKeyCategoryMeta[] = [
  { id: 'circuit', label: '回路基本情報', description: '盤・回路・負荷の基本情報', icon: 'zap' },
  { id: 'remote', label: 'リモコン設定', description: '負荷アドレス・グループ・パターン等', icon: 'sliders' },
  { id: 'cable', label: 'ケーブル・機器仕様', description: '配線サイズ・遮断器・接地等', icon: 'activity' },
  { id: 'meta', label: '現場・共通情報', description: '現場名・日付・共通メタ情報', icon: 'info' },
]

export interface TemplateKeyDefinition {
  /** 代表キー名 (例: "回路名称") */
  primaryKey: string
  /** 代表タグ表記 (例: "%回路名称%") */
  tag: string
  /** 互換エイリアス (例: ["負荷名称", "回路名", "負荷名"]) */
  aliases: string[]
  /** カテゴリ */
  category: TemplateKeyCategory
  /** 日本語表示名 */
  label: string
  /** 説明 */
  description: string
  /** データ例 */
  sampleValue: string
  /** 主な対象帳票 */
  targets: ('tag' | 'remote-address' | 'remote-group' | 'remote-pattern' | 'exam')[]
}

export const TEMPLATE_KEYS: TemplateKeyDefinition[] = [
  // --- 1. 回路基本情報 ---
  {
    primaryKey: '回路名称',
    tag: '%回路名称%',
    aliases: ['負荷名称', '回路名', '負荷名'],
    category: 'circuit',
    label: '回路名称（負荷名称）',
    description: '負荷や照明・コンセントの用途・名称',
    sampleValue: '事務室照明A',
    targets: ['tag', 'remote-address', 'remote-group', 'remote-pattern', 'exam'],
  },
  {
    primaryKey: '盤名称',
    tag: '%盤名称%',
    aliases: ['盤名', '分電盤名称'],
    category: 'circuit',
    label: '盤名称',
    description: '分電盤・制御盤の名称',
    sampleValue: '1L-1',
    targets: ['tag', 'remote-address', 'exam'],
  },
  {
    primaryKey: '回路番号',
    tag: '%回路番号%',
    aliases: ['回路no', '回路No'],
    category: 'circuit',
    label: '回路番号',
    description: '盤内の分岐回路番号',
    sampleValue: '1-R1',
    targets: ['tag', 'remote-address', 'exam'],
  },
  {
    primaryKey: '回路記号',
    tag: '%回路記号%',
    aliases: ['記号'],
    category: 'circuit',
    label: '回路記号',
    description: '図面上の回路記号（丸、二重丸、楕円等）',
    sampleValue: '丸',
    targets: ['tag', 'remote-address'],
  },
  {
    primaryKey: '系統',
    tag: '%系統%',
    aliases: ['系統種別', '区分'],
    category: 'circuit',
    label: '系統種別',
    description: '幹線・二次側・電灯・動力等の系統区分',
    sampleValue: '幹線',
    targets: ['tag', 'remote-address'],
  },

  // --- 2. リモコン設定 ---
  {
    primaryKey: '負荷アドレス',
    tag: '%負荷アドレス%',
    aliases: ['アドレス', '対象アドレス', '負荷ｱﾄﾞﾚｽ', 'ｱﾄﾞﾚｽ'],
    category: 'remote',
    label: '負荷アドレス',
    description: 'フル2線式リモコン等のチャンネル-サブアドレス',
    sampleValue: '1-1',
    targets: ['remote-address', 'remote-group', 'remote-pattern', 'tag'],
  },
  {
    primaryKey: 'リレー番号',
    tag: '%リレー番号%',
    aliases: ['ﾘﾚｰ番号', '機器番号'],
    category: 'remote',
    label: 'リレー番号',
    description: 'リモコンリレーの番号（R1〜R4等）',
    sampleValue: 'R1',
    targets: ['remote-address', 'tag'],
  },
  {
    primaryKey: '伝送系統',
    tag: '%伝送系統%',
    aliases: ['伝送', '伝送系'],
    category: 'remote',
    label: '伝送系統番号',
    description: '複数の伝送ラインがある場合の系統番号',
    sampleValue: '1',
    targets: ['remote-address', 'remote-group', 'remote-pattern'],
  },
  {
    primaryKey: '設定グループ',
    tag: '%設定グループ%',
    aliases: ['所属グループ', 'グループ設定', 'ｸﾞﾙｰﾌﾟ設定'],
    category: 'remote',
    label: '所属グループ一覧',
    description: '負荷が所属しているグループ番号一覧',
    sampleValue: '1, 3',
    targets: ['remote-address'],
  },
  {
    primaryKey: '設定パターン',
    tag: '%設定パターン%',
    aliases: ['所属パターン', 'パターン設定', 'ﾊﾟﾀｰﾝ設定'],
    category: 'remote',
    label: '所属パターン一覧',
    description: '負荷が所属しているパターン一覧',
    sampleValue: 'P1 ON, P2 OFF',
    targets: ['remote-address'],
  },

  // --- 3. ケーブル・機器仕様 ---
  {
    primaryKey: 'ケーブル',
    tag: '%ケーブル%',
    aliases: ['ケーブルサイズ', '電線', 'ケーブルリスト'],
    category: 'cable',
    label: 'ケーブル仕様・サイズ',
    description: 'ケーブルの種類およびサイズ規格',
    sampleValue: 'EM-EEF 2.0-3C',
    targets: ['tag', 'exam'],
  },
  {
    primaryKey: '配線条数',
    tag: '%配線条数%',
    aliases: ['条数'],
    category: 'cable',
    label: '配線条数',
    description: '布設条数',
    sampleValue: '1条',
    targets: ['tag'],
  },
  {
    primaryKey: '遮断器容量',
    tag: '%遮断器容量%',
    aliases: ['遮断器サイズ', '定格容量', 'AT'],
    category: 'cable',
    label: '遮断器容量',
    description: 'ブレーカーのフレーム/トリップ容量',
    sampleValue: '30AF/20AT',
    targets: ['tag', 'exam'],
  },
  {
    primaryKey: '遮断器種別',
    tag: '%遮断器種別%',
    aliases: ['ブレーカー種別'],
    category: 'cable',
    label: '遮断器種別',
    description: 'MCCB / ELCB などの種別',
    sampleValue: 'MCCB',
    targets: ['tag', 'exam'],
  },
  {
    primaryKey: '接地種別',
    tag: '%接地種別%',
    aliases: ['接地', '接地リスト'],
    category: 'cable',
    label: '接地種別',
    description: 'D種接地等の種別',
    sampleValue: 'D種',
    targets: ['tag', 'exam'],
  },

  // --- 4. 現場・共通情報 ---
  {
    primaryKey: '現場名',
    tag: '%現場名%',
    aliases: ['件名', '現場名称', '工事名'],
    category: 'meta',
    label: '現場名称・件名',
    description: '対象現場の工事名称',
    sampleValue: '〇〇ビル新築工事',
    targets: ['tag', 'remote-address', 'remote-group', 'remote-pattern', 'exam'],
  },
  {
    primaryKey: '出力日時',
    tag: '%出力日時%',
    aliases: ['作成日', '出力日', '日付'],
    category: 'meta',
    label: '出力日時',
    description: '帳票を出力した年月日・時刻',
    sampleValue: '2026-10-01',
    targets: ['tag', 'remote-address', 'remote-group', 'remote-pattern', 'exam'],
  },
]
