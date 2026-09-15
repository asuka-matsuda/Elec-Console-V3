/**
 * no-legacy-css-vars
 * [ESLint Custom Rule]
 * 廃止された旧デザイントークンや未定義CSS変数の使用を禁止し、
 * 最新のセマンティック変数への置換を促すルール。
 * （未定義変数によるスタイル無効化・ホバー黒落ちなどの逆転現象を100%未然防止）
 */

const LEGACY_VARS = {
  '--color-primary': '--theme-accent または --color-category-main',
  '--color-surface': '--surface-bg',
  '--color-surface-sunken': '--surface-bg-elevated',
  '--color-surface-hover': '--color-bg-hover',
  '--color-bg-subtle': '--surface-bg-elevated',
  '--color-bg-base': '--surface-bg',
  '--color-danger': '--color-status-danger',
  '--color-success': '--color-status-success',
  '--color-warning': '--color-status-warning',
  '--color-text-base': '--color-text-main',
  '--color-text-primary': '--color-text-main',
  '--color-text-dim': '--color-text-muted',
  '--radius-base': '--radius-sm',
  '--radius-xs': '--radius-sm',
  '--font-sans': '--font-base',
  '--font-family-mono': '--font-mono',
  '--leading-relaxed': '--line-height-base',
  '--line-height-relaxed': '--line-height-base',
}

const REGEX_PATTERN = new RegExp(
  `\\b(${Object.keys(LEGACY_VARS).map(k => k.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\$&')).join('|')})\\b`,
  'g',
)

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow usage of legacy or undefined CSS design tokens',
    },
    messages: {
      forbidden: '廃止された旧デザイントークン「{{ legacyVar }}」は使用禁止です。最新のセマンティックトークン「{{ replacement }}」を使用してください。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename()

    if (!filename.endsWith('.vue')) return {}

    return {
      Program() {
        const sourceCode = context.sourceCode || context.getSourceCode()
        const text = sourceCode.getText()

        let match

        REGEX_PATTERN.lastIndex = 0

        while ((match = REGEX_PATTERN.exec(text)) !== null) {
          const legacyVar = match[1]
          const replacement = LEGACY_VARS[legacyVar]
          const loc = sourceCode.getLocFromIndex(match.index)

          context.report({
            loc: {
              start: loc,
              end: { line: loc.line, column: loc.column + legacyVar.length },
            },
            messageId: 'forbidden',
            data: {
              legacyVar,
              replacement,
            },
          })
        }
      },
    }
  },
}
