export interface ColorPreset {
  name: string
  value: string // HEX color code e.g. '#2f81f7'
}

export const DEFAULT_COLOR = '#2f81f7'

export const DEFAULT_COLOR_PRESETS: ColorPreset[] = [
  { name: 'GitHub Blue (プライマリ)', value: DEFAULT_COLOR },
  { name: 'GitHub Green (サクセス)', value: '#3fb950' },
  { name: 'GitHub Purple (マージ・完了)', value: '#a371f7' },
  { name: 'GitHub Yellow (アテンション)', value: '#d29922' },
  { name: 'GitHub Orange (アラート)', value: '#f0883e' },
  { name: 'GitHub Red (デンジャー)', value: '#f85149' },
  { name: 'GitHub Cyan (ティール)', value: '#39c5cf' },
  { name: 'GitHub Pink (スポンサー)', value: '#db61a2' },
  { name: 'GitHub Sky (データベース)', value: '#58a6ff' },
  { name: 'GitHub Muted (ニュートラル)', value: '#8b949e' },
]
