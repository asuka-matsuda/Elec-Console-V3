import type { Config } from 'tailwindcss'

export default <Config>{
  // 既存の destyle.css / SCSS との競合を防ぐため preflight は false
  corePlugins: {
    preflight: false,
  },
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/app.{vue,js,ts}',
    './app/error.{vue,js,ts}',
  ],
  theme: {
    extend: {
      // 規約に基づき「レイアウト・配置・余白・寸法」に関するトークンのみを定義
      spacing: {
        '0.5': 'var(--space-0-5, 2px)',
        '1': 'var(--space-1, 4px)',
        '2': 'var(--space-2, 8px)',
        '3': 'var(--space-3, 12px)',
        '4': 'var(--space-4, 16px)',
        '5': 'var(--space-5, 20px)',
        '6': 'var(--space-6, 24px)',
        '8': 'var(--space-8, 32px)',
        '10': 'var(--space-10, 40px)',
        '12': 'var(--space-12, 48px)',
        '16': 'var(--space-16, 64px)',

        // セマンティック余白
        'layout-pad': 'var(--space-layout-pad)',
        'section-gap': 'var(--space-section-gap)',
        'panel-pad': 'var(--space-panel-pad)',
        'panel-gap': 'var(--space-panel-gap)',
        'card-pad': 'var(--space-card-pad)',
        'card-gap': 'var(--space-card-gap)',
        'form-row-gap': 'var(--space-form-row-gap)',
        'form-col-gap': 'var(--space-form-col-gap)',
        'item-gap': 'var(--space-item-gap)',
        'inline-gap': 'var(--space-inline-gap)',

        // 寸法
        'sidebar-w': 'var(--sidebar-width)',
      },
      width: {
        'sidebar-w': 'var(--sidebar-width)',
        'sm': 'var(--width-sm)',
        'md': 'var(--width-md)',
      },
      zIndex: {
        'footer': 'var(--z-index-footer)',
        'table-header': 'var(--z-index-table-header)',
        'nav': 'var(--z-index-nav)',
        'header': 'var(--z-index-header)',
        'dropdown': 'var(--z-index-dropdown)',
        'fab': 'var(--z-index-fab)',
        'sidebar': 'var(--z-index-sidebar)',
        'sidebar-overlay': 'var(--z-index-sidebar-overlay)',
        'modal': 'var(--z-index-modal)',
        'select': 'var(--z-index-select)',
      },
    },
  },
}
