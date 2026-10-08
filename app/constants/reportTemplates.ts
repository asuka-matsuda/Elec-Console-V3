/**
 * 帳票テンプレート・マスター定義定数
 *
 * @description システムでサポートする4つの帳票（線名札・テプラ・送電試験・リモコン）の基本定義および
 * テンプレート作成時にExcelセルへ記述できるキー一覧
 */
import { TAG_TEMPLATE_DEFINITIONS } from '#shared/templates/tag'
import type { ReportTemplateMeta } from '#shared/types/reportTemplate'

export const REPORT_TEMPLATE_DEFINITIONS: ReportTemplateMeta[] = [
  {
    id: 'tag',
    name: '線名札（タグ枠）',
    category: 'ラベル・表記',
    icon: 'tag',
    flowType: 'tags',
    description: 'A4用紙に複数面配置されたタグ枠へ、現場台帳の回路情報（盤名・回路番号・ケーブル等）を順次差し込みます。枠数超過時は自動改ページされます。',
    availableKeys: [
      { key: '%盤名称%', label: '盤名称', description: '電灯盤・動力盤・分電盤の名称', sample: '電灯盤 1L-1' },
      { key: '%系統%', label: '系統種別', description: '幹線または二次側の系統区分', sample: '二次' },
      { key: '%回路番号%', label: '回路番号', description: '盤内の回路番号', sample: '1-1' },
      { key: '%回路名称%', label: '回路名称・負荷名称', description: '接続されている負荷や照明の名称', sample: '2F 事務室コンセント' },
      { key: '%ケーブル%', label: 'ケーブル種別・サイズ', description: '配線されている電線・ケーブル', sample: 'VVF 2.0-3C' },
      { key: '%ブレーカー%', label: 'ブレーカー容量', description: '遮断器の容量・極数', sample: '2P20A' },
      { key: '%行き先%', label: '行き先・エリア', description: '設置エリアまたは行き先室名', sample: '執務エリア北側' },
      { key: '%現場名%', label: '現場プロジェクト名', description: '現場名', sample: '新宿新築プロジェクト' },
      { key: '%出力日時%', label: '出力日時', description: '帳票を出力した年月日', sample: '2026/10/05' },
    ],
  },
  {
    id: 'socket-tepra',
    name: 'コンセント用テプラ元データ',
    category: '現場ラベル・テプラ',
    icon: 'printer',
    flowType: 'list',
    description: 'PC接続型テプラ等でコンセント・スイッチ用ラベルを流し込み印刷するための元データ。盤名・回路番号・部屋名などを1行1レコードで展開します。',
    availableKeys: [
      { key: '%盤名称%', label: '盤名称', description: '電灯盤・分電盤の名称', sample: '1L-1' },
      { key: '%回路番号%', label: '回路番号', description: '回路番号', sample: '1-1' },
      { key: '%回路名称%', label: '回路名称', description: '回路の名称', sample: '事務室コンセント' },
      { key: '%電圧%', label: '電圧区分', description: '使用電圧', sample: '100V' },
      { key: '%部屋名称%', label: '設置場所・部屋名', description: 'コンセントが設置される室名', sample: '執務室A' },
      { key: '%コンセント番号%', label: 'コンセント番号・記号', description: '器具個別の識別記号', sample: 'C-1' },
      { key: '%テプラ表記%', label: 'テプラ合成短縮ラベル', description: '「盤名: 回路番号」形式の短縮合成文字列', sample: '1L-1: 1-1' },
      { key: '%現場名%', label: '現場プロジェクト名', description: '現場名', sample: '新宿新築プロジェクト' },
      { key: '%出力日時%', label: '出力日時', description: '出力年月日', sample: '2026/10/05' },
    ],
  },
  {
    id: 'exam',
    name: '送電試験結果成績書',
    category: '自主検査・試験記録',
    icon: 'zap',
    flowType: 'sheet',
    description: '各盤の送電前自主検査（フェーズ1〜3の測定値・合否判定・使用測定機器の型式/校正日）を差し込んだ公式試験記録シートを生成します。マクロ（.xlsm）にも対応。',
    availableKeys: [
      { key: '%現場名%', label: '現場名', description: '現場プロジェクト名', sample: '新宿新築プロジェクト' },
      { key: '%盤名称%', label: '盤名称', description: '対象盤の名称', sample: '電灯盤 1L-1' },
      { key: '%試験日%', label: '試験実施日', description: '送電試験の実施年月日', sample: '2026/10/05' },
      { key: '%測定者%', label: '測定担当者', description: '試験を実施した技術者氏名', sample: '松田 飛鳥' },
      { key: '%立会者%', label: '立会人', description: '監理者・立会技術者氏名', sample: '山田 太郎' },
      { key: '%絶縁抵抗計型式%', label: '絶縁抵抗計型式', description: '使用したメガーのメーカー・型番', sample: '日置電機 IR4052' },
      { key: '%絶縁抵抗計校正日%', label: 'メガー校正日', description: '有効期限・校正日', sample: '2026/04/01' },
      { key: '%電圧計型式%', label: '電圧計型式', description: '使用したテスターのメーカー・型番', sample: '共立電気計器 2000A' },
      { key: '%検相器型式%', label: '検相器型式', description: '使用した検相器の型式', sample: '日置電機 3129-10' },
      { key: '%総合判定%', label: '総合合否判定', description: '盤全体の試験結果', sample: '合格' },
      { key: '%回路番号%', label: '明細: 回路番号', description: '明細行の回路番号', sample: '1-1' },
      { key: '%回路名称%', label: '明細: 回路名称', description: '明細行の回路名称', sample: '1F 照明1' },
      { key: '%Phase1測定値%', label: '明細: Phase1測定値', description: '通電前絶縁抵抗値', sample: '100.0 MΩ' },
      { key: '%Phase2測定値%', label: '明細: Phase2測定値', description: '機器接続後絶縁抵抗値', sample: '50.0 MΩ' },
      { key: '%Phase3電圧%', label: '明細: Phase3受電電圧', description: '通電時実測電圧値', sample: '102.5 V' },
      { key: '%Phase3検相%', label: '明細: Phase3検相判定', description: '正相/逆相判定', sample: '正相' },
      { key: '%判定%', label: '明細: 合否判定', description: '回路ごとの合否判定', sample: '合格' },
    ],
  },
  {
    id: 'remote',
    name: 'フル2線式リモコン設定表',
    category: '盤・伝送制御',
    icon: 'sliders',
    flowType: 'matrix',
    description: 'フル2線式リモコンの負荷アドレス割当（1〜256）、編成グループ（G1〜G127）、編成パターン（P1〜P16）の設定表フォーマットへ自動転記します。',
    availableKeys: [
      { key: '%アドレス%', label: '負荷アドレス', description: '伝送ユニット個別アドレス', sample: '1-1' },
      { key: '%グループ番号%', label: 'グループ番号', description: '所属グループ番号', sample: 'G1' },
      { key: '%パターン番号%', label: 'パターン番号', description: '所属パターン番号', sample: 'P1' },
      { key: '%負荷名称%', label: '負荷名称', description: '制御対象の照明器具等の名称', sample: '事務室北側ベースライト' },
      { key: '%回路番号%', label: '連動回路番号', description: '分電盤内の接続回路', sample: 'L-1' },
      { key: '%制御区分%', label: '制御区分', description: '個別 / グループ / パターンの種別', sample: 'グループ制御' },
      { key: '%現場名%', label: '現場プロジェクト名', description: '現場名', sample: '新宿新築プロジェクト' },
      { key: '%出力日時%', label: '出力日時', description: '設定表出力年月日', sample: '2026/10/05' },
    ],
  },
]

export const REPORT_LOGIC_OPTIONS = [
  { label: '線名札（タグ枠）', value: 'tag' as const },
  { label: '送電試験結果成績書', value: 'exam' as const },
  { label: 'フル2線式リモコン設定表', value: 'remote' as const },
  { label: 'コンセント用テプラ元データ', value: 'socket-tepra' as const },
]

export const getReportLogicMeta = (type: string): ReportTemplateMeta => {
  return REPORT_TEMPLATE_DEFINITIONS.find(d => d.id === type) || REPORT_TEMPLATE_DEFINITIONS[0]!
}

export function getLogicFileOptions(logicType: string): { label: string, value: string }[] {
  if (logicType === 'tag') {
    return TAG_TEMPLATE_DEFINITIONS.map(def => ({
      label: `${def.id}.ts`,
      value: def.id,
    }))
  }

  if (logicType === 'exam') {
    return [
      { label: 'examReportExcel.ts', value: 'standard' },
    ]
  }

  if (logicType === 'remote') {
    return [
      { label: 'remoteReportExcel.ts', value: 'standard' },
    ]
  }

  if (logicType === 'socket-tepra') {
    return [
      { label: 'socketTepraExcel.ts', value: 'standard' },
    ]
  }

  return [
    { label: 'standard.ts', value: 'standard' },
  ]
}
