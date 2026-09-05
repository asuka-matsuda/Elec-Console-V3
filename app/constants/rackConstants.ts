export const STANDARD_RACK_SIZES = [
  100, 200, 300, 400, 500, 600, 800, 1000, 1200,
]

export const rackModeOptions = [
  { label: '強電', value: 'strong', color: 'var(--color-category-tool)' },
  { label: '弱電', value: 'weak', color: 'var(--color-category-tool)' },
]

export const RACK_DEFAULT_PARAMS = {
  strong: {
    marginRate: 1.2,
    cableSpacing: 10,
    sideMargin: 60,
  },
  weak: {
    marginRate: 0.6,
    cableSpacing: 10,
    sideMargin: 120,
  },
} as const
