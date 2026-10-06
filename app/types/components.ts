/**
 * UI コンポーネント共通型定義
 *
 * ボタン、フォーム入力、モーダル、テーブルカラム等の共通 Props / Emits インターフェースを定義します。
 */

import type { IconName } from '~/constants/icons'

// ============================================================================
// 1. 共通UIデータ型 & 選択肢オプション型 (Common Options & Table / Nav)
// ============================================================================

/** 汎用セレクトボックス用選択肢 */
export interface SelectOption<T = string | number | boolean> {
  label: string
  value: T
  disabled?: boolean
  color?: string
}

/** 汎用ラジオボタングループ用選択肢 (SelectOption と同等) */
export type RadioOption<T = string | number | boolean> = SelectOption<T>

/** 汎用タブ選択肢 */
export interface TabOption<V = string | number> {
  label: string
  value: V
  disabled?: boolean
  /** タブ左側に表示するアイコン（任意） */
  icon?: IconName
  /** タブ右側に表示するバッジ（任意） */
  badge?: string | number
  /** バッジの発光色（任意。CSS変数またはカラー値） */
  badgeColor?: string
}

/** 汎用テーブルカラム定義 */
export interface TableColumn<T = Record<string, unknown>> {
  key: (keyof T & string) | string
  label: string
  /** ソート可能フラグ（明示的に true の場合のみソート有効） */
  sortable?: boolean
  /** 列幅（例: '120px', '20%'） */
  width?: string
  minWidth?: string
  maxWidth?: string
  align?: 'left' | 'center' | 'right'
  /** この列でテキスト省略（...）を行うかどうか */
  truncate?: boolean
  /** 値が空（null, undefined, 空文字）の時のフォールバック表示 */
  emptyFallback?: string
  /** セルに適用する追加クラス */
  class?: string
  /** 2段組セル等のサブキー */
  subKey?: string
  /** 表示値のカスタムフォーマッタ関数 */
  format?: (value: unknown, row: T) => unknown
}

/** パンくずリスト項目 */
export interface BreadcrumbItem {
  text: string
  to?: string
  disabled?: boolean
}

export interface BreadcrumbsProps {
  /** パンくずリスト項目配列 */
  items?: BreadcrumbItem[]
  /** セパレーター（文字列指定時。未指定時は chevron-right アイコン） */
  separator?: string
  /** 末尾アイテムのコンソールカーソル点滅演出 (デフォルト: true) */
  cursor?: boolean
}

// ============================================================================
// 2. Atoms（最小構成要素）
// ============================================================================

// --- Button ---
export type ButtonVariant
  = 'primary'
    | 'secondary'
    | 'tertiary'
    | 'danger'
    | 'warning'

export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  /** リンク先パス (指定時は NuxtLink として描画) */
  to?: string
  /** HTML type 属性 */
  type?: 'button' | 'submit' | 'reset'
  /** カラーバリアント (Geist準拠: primary / secondary / tertiary / danger / warning) */
  variant?: ButtonVariant
  /** ボタンサイズ (Geist準拠: sm / md / lg) */
  size?: ButtonSize
  /** 無効化フラグ */
  disabled?: boolean
  /** ローディング状態フラグ */
  loading?: boolean
  /** 前置アイコン名 */
  icon?: IconName
  /** 後置アイコン名 (Geist準拠) */
  suffixIcon?: IconName
  /** 横幅100%（全幅）表示フラグ */
  block?: boolean
}

// --- Avatar ---
export type AvatarSize = 'sm' | 'md' | 'lg'

export interface AvatarProps {
  /** アバター画像 URL */
  src?: string
  /** 画像代替テキスト */
  alt?: string
  /** 表示テキストまたはイニシャル（1〜2文字、画像が無い場合のフォールバック） */
  text?: string
  /** サイズ ('sm' = 24px, 'md' = 32px [デフォルト], 'lg' = 40px) */
  size?: AvatarSize
}

// --- Badge ---
export type BadgeVariant
  = | 'gray'
    | 'blue'
    | 'purple'
    | 'amber'
    | 'red'
    | 'pink'
    | 'green'
    | 'teal'
    | 'inverted'
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'accent'
    | 'neutral'

export type BadgeContrast = 'high' | 'low'
export type BadgeSize = 'sm' | 'md' | 'lg'

export interface BadgeProps {
  /** カラーバリアント (Geist準拠) */
  variant?: BadgeVariant
  /** コントラスト ('high' = 通常, 'low' = サブトル/淡い背景) */
  contrast?: BadgeContrast
  /** サイズ */
  size?: BadgeSize
  /** 前置アイコン名 */
  icon?: IconName
}

// --- Gauge (Geist準拠: 円形メーター・クォータ・健全性表示) ---
export type GaugeSize = 'tiny' | 'sm' | 'md' | 'lg'
export type GaugeVariant = 'default' | 'success' | 'warning' | 'danger'

export interface GaugeProps {
  /** 0〜100 の数値（または割合） */
  value?: number
  /** 最小値 (デフォルト: 0) */
  min?: number
  /** 最大値 (デフォルト: 100) */
  max?: number
  /** サイズ展開 (Geist準拠: 'tiny' = 24px, 'sm' = 48px, 'md' = 80px [デフォルト], 'lg' = 140px) */
  size?: GaugeSize
  /** 数値・パーセントラベルを表示するか (デフォルト: true、tiny時は自動非表示) */
  showValue?: boolean
  /** カラーバリアント (未指定時はカラースケール自動適用) */
  variant?: GaugeVariant
  /** カスタムカラー (CSS変数またはカラーコード) */
  color?: string
  /** 補助ラベル（中央下部またはコンポーネント下部に表示） */
  label?: string
}

// --- Progress (Geist準拠: 水平プログレスバー・確定タスク進捗表示) ---
export type ProgressSize = 'sm' | 'md' | 'lg'
export type ProgressVariant = 'default' | 'success' | 'warning' | 'danger'

export interface ProgressProps {
  /** 進捗値 (0〜max) */
  value?: number
  /** 上限・最大値 (デフォルト: 100) */
  max?: number
  /** バーの高さ・サイズ ('sm' = 4px, 'md' = 8px [デフォルト], 'lg' = 12px) */
  size?: ProgressSize
  /** カラーバリアント (デフォルト: 'success') */
  variant?: ProgressVariant
  /** 値に応じた動的カラースケールを有効にするか */
  dynamicColors?: boolean
  /** カスタムカラー (CSS変数またはカラーコード) */
  color?: string
}

// --- Checkbox (Geist準拠) ---
export interface CheckboxProps {
  /** HTML id属性 */
  id?: string
  /** チェックボックスの値（配列 v-model 時に使用） */
  value?: unknown
  /** ラベルテキスト */
  label?: string
  /** 無効化フラグ */
  disabled?: boolean
  /** エラー状態フラグ (デフォルト: false) */
  error?: boolean
  /** 不確定（中間・部分選択）状態。true の場合、チェックマークではなく水平バー（minusアイコン）を表示 */
  indeterminate?: boolean
  /** カテゴリカラー等のカスタム色指定 */
  color?: string
  /** ホバーツールチップテキスト */
  title?: string
}

// --- Icon ---
export type IconSize = 'sm' | 'md' | 'lg'
export type IconVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'muted'

export interface IconProps {
  name: IconName
  size?: IconSize
  variant?: IconVariant
  spin?: boolean
}

// --- Input ---
export type InputType
  = 'text'
    | 'password'
    | 'email'
    | 'number'
    | 'search'
    | 'tel'
    | 'url'
    | 'date'
    | 'datetime-local'
    | 'time'

export type InputMode
  = 'none'
    | 'text'
    | 'decimal'
    | 'numeric'
    | 'tel'
    | 'search'
    | 'email'
    | 'url'

// --- Input (Geist準拠) ---
export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps {
  /** HTML id属性 */
  id?: string
  /** フォーム名属性 */
  name?: string
  /** 入力タイプ (デフォルト: 'text') */
  type?: InputType
  /** プレースホルダー */
  placeholder?: string
  /** サイズ ('sm' = 32px, 'md' = 40px [デフォルト], 'lg' = 48px) */
  size?: InputSize
  /** 無効化状態 (デフォルト: false) */
  disabled?: boolean
  /** 読み取り専用状態 (デフォルト: false) */
  readonly?: boolean
  /** エラー状態フラグ (デフォルト: false) */
  error?: boolean
  /** 前置アイコン名 */
  icon?: IconName
  /** 後置アイコン名 */
  suffixIcon?: IconName
  /** 前置テキストラベル (例: 'https://') */
  prefix?: string
  /** 後置テキストラベル (例: '.com') */
  suffix?: string
  /** 入力値の末尾空白自動トリム (デフォルト: true) */
  trim?: boolean
  /** 最小値（number / date / time 等） */
  min?: number | string
  /** 最大値（number / date / time 等） */
  max?: number | string
  /** ステップ刻み値（number / date / time 等） */
  step?: number | string
  /** 入力モード (仮想キーボード制御) */
  inputmode?: InputMode
  /** ブラウザ自動補完 */
  autocomplete?: string
  /** 最大文字数 */
  maxlength?: number
  /** ホバーツールチップテキスト */
  title?: string
}

// --- Clearable Input (Geist準拠) ---
export interface ClearableInputProps extends InputProps {
  /** クリアボタンのツールチップテキスト */
  clearTitle?: string
}

// --- Select (Geist準拠) ---
export type SelectSize = 'sm' | 'md' | 'lg'

export interface SelectProps<T = string | number | boolean> {
  /** 選択肢リスト */
  options?: SelectOption<T>[]
  /** プレースホルダー (例: 'フレームワークを選択') */
  placeholder?: string
  /** サイズ ('sm' = 32px, 'md' = 40px [デフォルト], 'lg' = 48px) */
  size?: SelectSize
  /** 前置アイコン名 */
  icon?: IconName
  /** 前置テキストラベル */
  prefix?: string
  /** 横幅100%（全幅）表示フラグ */
  block?: boolean
  /** 無効化状態 (デフォルト: false) */
  disabled?: boolean
  /** エラー状態フラグ (デフォルト: false) */
  error?: boolean
  /** HTML id属性 */
  id?: string
  /** フォーム名属性 */
  name?: string
  /** ホバーツールチップテキスト */
  title?: string
}

// --- Textarea ---
export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both'
export type TextareaSize = 'sm' | 'md' | 'lg'

export interface TextareaProps {
  /** HTML id属性 */
  id?: string
  /** フォーム名属性 */
  name?: string
  /** サイズ（sm / md・デフォルト / lg） */
  size?: TextareaSize
  /** 行数 (デフォルト: 4) */
  rows?: number
  /** リサイズ方向 (デフォルト: 'vertical') */
  resize?: TextareaResize
  /** プレースホルダー（入力例を記述） */
  placeholder?: string
  /** 無効化状態 (デフォルト: false) */
  disabled?: boolean
  /** 読み取り専用状態 (デフォルト: false) */
  readonly?: boolean
  /** エラー状態フラグまたはエラーメッセージ (デフォルト: false) */
  error?: boolean | string
  /** 入力内容に応じた高さ自動伸縮（オートリサイズ） (デフォルト: false) */
  autoResize?: boolean
  /** blur/change時の前後の余分な空白自動除去 (デフォルト: false) */
  trim?: boolean
  /** 最大文字数 */
  maxlength?: number
  /** ホバーツールチップテキスト */
  title?: string
}

// --- Skeleton ---
export type SkeletonElement = 'span' | 'div'

export interface SkeletonProps {
  /** 幅（CSS値 例: '100%', '120px', '4rem', または数値 160） */
  width?: string | number
  /** 高さ（CSS値 例: '1em', '40px', または数値 40） */
  height?: string | number
  /** 外側コンテナの高さ / 最小高（Geist準拠） */
  boxHeight?: string | number
  /** 真円フラグ（アバターや円形アイコン用） */
  circle?: boolean
  /** ピル・真円形状（Geist準拠エイリアス） */
  pill?: boolean
  /** 直角形状（Geist準拠、プロジェクト標準） */
  squared?: boolean
  /** スケルトン表示フラグ（デフォルト: true。false時はスロットの子要素を表示） */
  show?: boolean
  /** アニメーション（シマー）の有効化（デフォルト: true） */
  animated?: boolean
  /** ボタン用スケルトン調整（Geist準拠） */
  button?: boolean
  /** 描画するHTML要素タグ（デフォルト: 'span'） */
  as?: SkeletonElement
}

// --- Toggle (Geist準拠: 単一機能の即時ON/OFF切り替えスライドスイッチ) ---
export type ToggleSize = 'sm' | 'md' | 'lg'
export type ToggleColor = 'default' | 'blue' | 'amber' | 'green' | 'red' | 'purple'

export interface ToggleProps {
  /** HTML id属性（未指定時は自動生成） */
  id?: string
  /** フォーム名属性 */
  name?: string
  /** ラベルテキスト（Title Case名詞句） */
  label?: string
  /** 補足説明テキスト（Geist準拠: ON状態の機能を説明する1文） */
  description?: string
  /** サイズ（sm / md・デフォルト / lg） */
  size?: ToggleSize
  /** カラーバリアント（Geist準拠） */
  color?: ToggleColor
  /** 無効化フラグ */
  disabled?: boolean
  /** ローディング中フラグ */
  loading?: boolean
  /** ON状態のサム内アイコン名 */
  iconChecked?: string
  /** OFF状態のサム内アイコン名 */
  iconUnchecked?: string
  /** ホバーツールチップテキスト */
  title?: string
}

// --- Switch (Geist準拠: 2〜3個の排他的なモード・ビュー切り替えセグメント) ---
export type SwitchSize = 'sm' | 'md' | 'lg'

export interface SwitchOption<T extends string | number = string | number> {
  label: string
  value: T
  disabled?: boolean
  icon?: IconName
}

export interface SwitchProps<T extends string | number = string | number> {
  /** 選択肢オプション（2〜3項目推奨） */
  options?: readonly SwitchOption<T>[] | SwitchOption<T>[]
  /** 選択中の値 */
  modelValue?: T
  /** サイズ（sm / md・デフォルト / lg） */
  size?: SwitchSize
  /** 全体無効化フラグ */
  disabled?: boolean
}

// --- Tooltip ---
export type TooltipPlacement
  = 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-start'
    | 'top-end'
    | 'bottom-start'
    | 'bottom-end'
    | 'left-start'
    | 'left-end'
    | 'right-start'
    | 'right-end'

export type TooltipType = 'default' | 'invert' | 'secondary' | 'warning' | 'error' | 'success'

export interface TooltipProps {
  /** ツールチップに表示するテキスト（句または文） */
  text?: string
  /** text のエイリアス */
  content?: string
  /** 表示位置 (デフォルト: 'top') */
  placement?: TooltipPlacement
  /** カラータイプ (デフォルト: 'default') */
  type?: TooltipType
  /** 表示遅延ミリ秒 (デフォルト: 150) */
  delay?: number
  /** 表示遅延ミリ秒 (delay より優先) */
  enterDelay?: number
  /** 非表示遅延ミリ秒 (デフォルト: 0) */
  leaveDelay?: number
  /** 矢印（チップインジケーター）を非表示にするか */
  hideArrow?: boolean
  /** デスクトップ環境でのみ表示するか */
  desktopOnly?: boolean
  /** 無効化フラグ */
  disabled?: boolean
}

// --- Table ---
export type TableSortOrder = 'asc' | 'desc' | null

// ============================================================================
// 3. Molecules（複合コンポーネント）
// ============================================================================

// --- Toast (Geist準拠) ---
export type ToastType = 'info' | 'success' | 'warning' | 'danger' | 'default'

export interface ToastAction {
  /** アクションボタンのラベルテキスト */
  label: string
  /** アクション実行時のコールバック */
  onClick: () => void | Promise<void>
}

export interface ToastOptions {
  /** カラーバリアント (Geist準拠: default / info / success / warning / danger) */
  type?: ToastType
  /** 表示時間（ミリ秒。デフォルト: 通常3500ms、警告4500ms、エラー5000ms） */
  duration?: number
  /** 自動消滅を無効化し、手動で閉じるまで保持するか (Geist準拠) */
  preserve?: boolean
  /** インラインアクションボタン（Geist準拠: Undo、確認、再試行等） */
  action?: ToastAction
  /** キャンセルボタン（任意） */
  cancel?: ToastAction
}

export interface ToastItem extends ToastOptions {
  id: string
  message: string
  type: ToastType
}

// --- Menu (Geist準拠) ---
export type MenuItemVariant = 'default' | 'secondary' | 'danger'

export interface MenuItem {
  /** 項目ラベル（Title Case: Verb + Noun） */
  label: string
  /** 前置アイコン名 */
  icon?: IconName
  /** 後置アイコン名 */
  suffixIcon?: IconName
  /** カラーバリアント (Geist準拠: default / secondary / danger) */
  variant?: MenuItemVariant
  /** 無効化フラグ */
  disabled?: boolean
  /** 権限不足等によるロック状態（Geist準拠: disabled + ロックアイコン付与） */
  locked?: boolean
  /** 直前に区切り線を描画するか */
  divider?: boolean
  /** グループ・セクション見出し（Title Case: 1〜2語） */
  section?: string
  /** 画面内遷移先パス (指定時は NuxtLink として描画) */
  to?: string
  /** 外部リンク URL */
  href?: string
  /** クリック時のアクション関数 */
  action?: () => void | Promise<void>
}

export interface MenuProps {
  /** メニュー項目一覧（最大10項目目安） */
  items?: MenuItem[]
  /** トリガーアイコン（デフォルト: 'more-vertical'） */
  icon?: IconName
  /** トリガーボタンラベル（未指定時はアイコンのみ） */
  label?: string
  /** トリガーボタンバリアント（デフォルト: 'secondary'） */
  variant?: ButtonVariant
  /** トリガーボタンサイズ（デフォルト: 'sm'） */
  size?: ButtonSize
  /** シェブロン矢印アイコンを表示するか（Geist準拠） */
  withChevron?: boolean
  /** 無効化フラグ */
  disabled?: boolean
}

/** 既存コード後方互換エイリアス */
export type DropdownMenuItem = MenuItem
export type DropdownMenuProps = MenuProps

// --- Calculation Status & Details ---
export type ResultStatus = 'neutral' | 'success' | 'warning' | 'danger' | 'empty'
export type ResultTileStatus = ResultStatus

export interface ResultDetailItem {
  label: string
  value: string | number
  unit?: string
  note?: string
}

// --- EmptyState ---
export type EmptyStateVariant
  = 'default'
    | 'no-results'
    | 'informational'
    | 'cleared'
    | 'permission'
    | 'error'

export type EmptyStateSize = 'sm' | 'md' | 'lg'

export interface EmptyStateProps {
  /** アイコン名 */
  icon?: IconName
  /** タイトル（Title Case） */
  title?: string
  /** 補足説明文（Sentence case） */
  description?: string
  /** 空状態のバリアント (デフォルト: 'default') */
  variant?: EmptyStateVariant
  /** 表示サイズ (デフォルト: 'md') */
  size?: EmptyStateSize
  /** 直角の外枠ボーダーを表示するか (デフォルト: false) */
  bordered?: boolean
  /** アイコン回転アニメーション */
  spin?: boolean
}

// --- Table ---
export interface TableProps<T = Record<string, unknown>> {
  /** カラム定義配列 */
  columns: TableColumn<T>[]
  /** 描画するデータ配列 */
  data?: T[]
  /** ソート対象キー（v-model:sortBy 対応） */
  sortBy?: string
  /** ソート方向（v-model:sortOrder 対応） */
  sortOrder?: TableSortOrder
  /** 行識別子（キー）の解決プロパティ名または関数 */
  rowKey?: string | ((row: T) => string | number)
  /** 各行（tr）のカスタムクラス解決関数 */
  rowClass?: (row: T, index: number) => string | Record<string, boolean | undefined> | (string | Record<string, boolean | undefined>)[] | undefined
  /** 各行（tr）の HTML id 解決関数 */
  rowId?: (row: T, index: number) => string
  /** データが0件の時の表示文言 */
  emptyText?: string
  /** ローディング状態フラグ */
  loading?: boolean
  /** ローディング時の表示文言 (スロット使用時等) */
  loadingText?: string
  /** ローディング時に描画するスケルトン行数 (デフォルト: 5) */
  skeletonRows?: number
  /** 行クリックのインタラクション（ホバー・アクティブ演出）を有効にするか */
  interactiveRow?: boolean
}

// --- Note (Geist準拠: インライン告知・コンテキスト通知) ---
export type NoteVariant = 'secondary' | 'warning' | 'error' | 'success' | 'danger' | 'info' | 'default'

export interface NoteAction {
  /** アクションボタンラベル */
  label: string
  /** クリック時のアクションコールバック */
  onClick: () => void | Promise<void>
}

export interface NoteProps {
  /** バリアント (Geist準拠: secondary / warning / error / success) */
  variant?: NoteVariant
  /** アイコン名 (未指定時はバリアント標準アイコン) */
  icon?: IconName
  /** タイトル (任意) */
  title?: string
  /** 本文テキスト (スロット未指定時に表示) */
  text?: string
  /** 塗りの背景スタイルを適用するか (Geist準拠: fill) */
  fill?: boolean
  /** インラインアクション (単一CTAボタン) */
  action?: NoteAction
}

/** 既存コード後方互換エイリアス */
export type AlertVariant = NoteVariant
export type AlertProps = NoteProps

// --- Banner ---
export type BannerVariant = 'gray' | 'warning' | 'success' | 'danger'

export interface BannerProps {
  /** バリアント (Geist準拠: 'gray' | 'warning' | 'success' | 'danger') */
  variant?: BannerVariant
  /** アイコン名 (未指定時はバリアントに応じたデフォルトアイコン) */
  icon?: IconName
  /** タイトルテキスト */
  title?: string
  /** サブテキスト・補足説明 */
  sub?: string
  /** 閉じるボタンを表示するかどうか */
  dismissible?: boolean
}

// --- Calendar (Geist準拠 日付・期間選択ピッカー) ---
export type CalendarMode = 'single' | 'range'
export type CalendarSize = 'sm' | 'md'

export interface DateRange {
  start: string | null
  end: string | null
}

export interface CalendarPreset {
  label: string
  /** プリセット値（YYYY-MM-DD または DateRange オブジェクト） */
  range: DateRange | string
}

export interface CalendarProps {
  /** 選択モード (Geist準拠: 'single' | 'range'、デフォルト: 'single') */
  mode?: CalendarMode
  /** サイズ展開 (Geist準拠: 'sm' | 'md'、デフォルト: 'md') */
  size?: CalendarSize
  /** 選択可能な最小日付 (YYYY-MM-DD) */
  min?: string
  /** 選択可能な最大日付 (YYYY-MM-DD) */
  max?: string
  /** プリセット選択肢（主に range モードで使用） */
  presets?: CalendarPreset[]
  /** プリセットの配置レイアウト (Geist準拠: 'horizontal' | 'stacked'、デフォルト: 'horizontal') */
  layout?: 'horizontal' | 'stacked'
  /** コンポーネント全体の無効化フラグ */
  disabled?: boolean
}

// --- Tabs (Geist準拠: ビュー切替・ナビゲーション) ---
export type TabItem<V = string | number> = TabOption<V>
export type TabsSize = 'sm' | 'md' | 'lg'

export interface TabsProps<V = string | number> {
  /** タブ選択肢リスト */
  items: TabItem<V>[]
  /** 選択中タブの値（v-model） */
  modelValue?: V
  /** サイズ ('sm' | 'md' [デフォルト] | 'lg') */
  size?: TabsSize
  /** 全体無効化フラグ */
  disabled?: boolean
}

// ============================================================================
// 4. Organisms（構造化コンポーネント）
// ============================================================================

export interface GlobalNavProps {
  menuData?: import('~/constants/data/menuData').MenuSection[]
}

export type ModalSize = 'sm' | 'md' | 'lg' | 'full'

export interface ModalProps {
  /** モーダルタイトル */
  title?: string
  /** 前置アイコン名 */
  icon?: IconName
  /** テキスト配置 */
  align?: 'left' | 'center'
  /** デフォルト閉じるボタンの文言 (デフォルト: '閉じる') */
  closeText?: string
  /** モーダルサイズ ('sm' = 400px, 'md' = 540px [デフォルト], 'lg' = 720px, 'full' = 92vw) */
  size?: ModalSize
}
