export const EXAM_STATUS = {
  NOT_STARTED: '未実施',
  PASSED: '合格',
  FAILED: '不良',
  FIXED: '手直し完了',
  EXCLUDED: '除外',
} as const;

export const KAIRO_KIGOU_LIST = ['L', 'P', 'C', 'M', 'E'];

export const PHASE1_HEADERS = [
  { key: 'kairo_kigou', label: '記号' },
  { key: 'target', label: '対象' },
  { key: 'location', label: '設置場所' },
  { key: 'status', label: '判定' },
  { key: 'memo', label: '備考' },
  { key: 'actions', label: '操作' },
];

export const PHASE2_HEADERS = [
  { key: 'kairo_kigou', label: '記号' },
  { key: 'target', label: '対象' },
  { key: 'location', label: '設置場所' },
  { key: 'result_value', label: '測定値 (MΩ)' },
  { key: 'status', label: '判定' },
  { key: 'memo', label: '備考' },
  { key: 'actions', label: '操作' },
];

export const PHASE3_HEADERS = [
  { key: 'kairo_kigou', label: '記号' },
  { key: 'target', label: '対象' },
  { key: 'location', label: '設置場所' },
  { key: 'result_value', label: '測定値 (V)' },
  { key: 'status', label: '判定' },
  { key: 'memo', label: '備考' },
  { key: 'actions', label: '操作' },
];
