/**
 * Badge Presets Configuration
 * バッジのプリセットIDとカラー・デフォルトラベルの対応定義。
 * 画面側での三項演算子やカラーのハードコードを防ぎ、ID参照による一貫したバッジ表現を提供します。
 */

export interface BadgePresetItem {
  color: string
  label?: string
}

export const BADGE_PRESETS = {
  // 1. ユーザーロール (User Roles) & アカウントフラグ
  'role:admin': { color: 'var(--color-role-admin)', label: '管理者' },
  'role:worker': { color: 'var(--color-role-worker)', label: '作業者' },
  'role:viewer': { color: 'var(--color-role-viewer)', label: '閲覧者' },
  'user:pwd-reset': { color: 'var(--color-status-danger)', label: 'PWリセット要求' },

  // 2. 現場ステータス (Site Statuses) & 属性
  'site:planning': { color: 'var(--color-text-muted)', label: '計画中' },
  'site:in_progress': { color: 'var(--color-status-warning)', label: '進行中' },
  'site:completed': { color: 'var(--color-status-success)', label: '完了' },
  'site:on_hold': { color: 'var(--color-status-danger)', label: '保留' },
  'site:disabled': { color: 'var(--color-status-danger)', label: '無効' },
  'site:worker-tag': { color: 'var(--color-category-main)' },

  // 3. 送電試験・合否・検相・除外判定
  'exam:pass': { color: 'var(--color-status-success)', label: 'OK' },
  'exam:fail': { color: 'var(--color-status-danger)', label: 'NG' },
  'exam:phase-normal': { color: 'var(--color-status-success)', label: '正相' },
  'exam:phase-reverse': { color: 'var(--color-status-danger)', label: '逆相' },
  'exam:light-ok': { color: 'var(--color-status-success)', label: '点灯確認(良)' },
  'exam:light-ng': { color: 'var(--color-status-danger)', label: '点灯確認(不良)' },
  'exam:excluded': { color: 'var(--color-text-muted)' },

  // 4. 送電フェーズ
  'souden:phase-warning': { color: 'var(--color-status-warning)' },
  'souden:phase-tool': { color: 'var(--color-category-tool)' },

  // 5. 操作ログ
  'log:success': { color: 'var(--color-status-success)' },
  'log:danger': { color: 'var(--color-status-danger)' },
  'log:accent': { color: 'var(--theme-accent)' },
  'log:neutral': { color: 'var(--color-status-neutral)' },

  // 6. Excel同期差分
  'sync:added': { color: 'var(--color-status-success)' },
  'sync:updated': { color: 'var(--color-category-tool)' },
  'sync:imported': { color: 'var(--color-status-success)' },

  // 7. 計算ツール・履歴
  'tool:size-select': { color: 'var(--color-category-tool)', label: 'サイズ選定' },
  'tool:voltage-drop': { color: 'var(--theme-accent)', label: '電圧降下' },
  'tool:overflow': { color: 'var(--color-status-warning)', label: '高さ不足' },
  'tool:size-over': { color: 'var(--color-status-danger)', label: '規格外' },

  // 8. 工種カテゴリ
  'trade:electric': { color: 'var(--color-trade-electric)', label: '電気' },
  'trade:architecture': { color: 'var(--color-trade-architecture)', label: '建築' },
  'trade:hvac': { color: 'var(--color-trade-hvac)', label: '空調・換気' },
  'trade:plumbing': { color: 'var(--color-trade-plumbing)', label: '衛生' },
  'trade:trivia': { color: 'var(--color-trade-trivia)', label: '雑学' },

  // 9. フォーム・システム警告・更新履歴
  'system:unsaved': { color: 'var(--color-status-warning)', label: '未保存の変更あり' },
  'version:muted': { color: 'var(--color-text-muted)' },

  // 10. 汎用判定・ステータス
  'status:danger': { color: 'var(--color-status-danger)' },
  'status:warning': { color: 'var(--color-status-warning)' },
  'status:success': { color: 'var(--color-status-success)' },
  'status:neutral': { color: 'var(--color-status-neutral)' },
} as const satisfies Record<string, BadgePresetItem>

export type BadgePresetId = keyof typeof BADGE_PRESETS
