export interface ColorPreset {
  name: string
  value: string // HEX color code e.g. '#00f0ff'
}

export const DEFAULT_COLOR_PRESETS: ColorPreset[] = [
  { name: 'シアン', value: '#00f0ff' },
  { name: 'エメラルド', value: '#10b981' },
  { name: 'スカイブルー', value: '#0ea5e9' },
  { name: 'インディゴ', value: '#6366f1' },
  { name: 'パープル', value: '#a855f7' },
  { name: 'アンバー', value: '#f59e0b' },
  { name: 'オレンジ', value: '#f97316' },
  { name: 'ローズ', value: '#f43f5e' },
  { name: 'ライム', value: '#84cc16' },
  { name: 'スレート', value: '#94a3b8' },
]
