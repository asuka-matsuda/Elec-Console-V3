export interface ColorPreset {
  name: string
  value: string // HEX color code e.g. '#2f81f7'
}

export const DEFAULT_COLOR = '#2f81f7'

export const DEFAULT_COLOR_PRESETS: ColorPreset[] = [
  { name: 'GitHub Blue (プライマリ)', value: DEFAULT_COLOR },
  { name: 'GitHub Green (現場管理)', value: '#3fb950' },
  { name: 'GitHub Cyan (計算ツール)', value: '#39c5cf' },
  { name: 'GitHub Orange (データベース)', value: '#f0883e' },
  { name: 'GitHub Purple (用語解説)', value: '#a371f7' },
  { name: 'GitHub Yellow (アテンション)', value: '#d29922' },
  { name: 'GitHub Red (デンジャー)', value: '#f85149' },
  { name: 'GitHub Coral (コーラル)', value: '#f778ba' },
  { name: 'GitHub Sky (スカイ)', value: '#58a6ff' },
  { name: 'GitHub Muted (ニュートラル)', value: '#8b949e' },
]
