/**
 * no-tailwind-decoration
 * [ESLint Custom Rule]
 * Vue テンプレート内の class / :class において、Tailwind CSS の装飾系ユーティリティ
 * （フォントサイズ、ウェイト、カラー、角丸、境界線、シャドウ、エフェクト、カーソル等）の使用を禁止し、
 * Scoped CSS（デザイントークン）への移行を促すルール。
 */

const LAYOUT_EXACT = new Set([
  'text-left',
  'text-center',
  'text-right',
  'text-justify',
  'text-start',
  'text-end',
])

const DECORATION_PATTERNS = [
  { category: 'フォントサイズ', regex: /^text-(xs|sm|base|lg|xl|[2-9]xl)$/ },
  { category: 'フォントウェイト', regex: /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/ },
  { category: 'フォントファミリー', regex: /^font-(sans|serif|mono)$/ },
  { category: '字間/行間', regex: /^(leading-|tracking-)/ },
  { category: 'テキスト装飾', regex: /^(truncate|uppercase|lowercase|capitalize|normal-case|italic|not-italic|underline|line-through|no-underline|tabular-nums)$/ },
  { category: 'テキストカラー', regex: /^text-((\[var\(.+?\)\])|(\[color-mix.+?\])|white|black|transparent|current|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)/ },
  { category: '背景カラー', regex: /^bg-((\[var\(.+?\)\])|(\[color-mix.+?\])|white|black|transparent|current|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)/ },
  { category: '角丸', regex: /^rounded(-.+)?$/ },
  { category: '境界線装飾', regex: /^(border(-[0-9]+|-dashed|-dotted|-double|-none)?|border-((\[.+?\])|white|black|transparent|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose))/ },
  { category: 'シャドウ', regex: /^(shadow(-.+)?|drop-shadow(-.+)?)$/ },
  { category: 'エフェクト/フィルター', regex: /^(blur(-.+)?|backdrop-blur(-.+)?|grayscale(-.+)?|filter)$/ },
  { category: 'カーソル', regex: /^cursor-(pointer|not-allowed|default|wait|text|move|help)$/ },
]

function extractTokens(classStr) {
  const tokens = []
  const regex = /(!?[\w\-:]+(\[.+?\])?)/g
  let m

  while ((m = regex.exec(classStr)) !== null) {
    const token = m[1]

    if (['true', 'false', 'null', 'undefined', 'return'].includes(token)) continue
    tokens.push(token)
  }

  return tokens
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow non-layout Tailwind CSS classes in templates',
    },
    messages: {
      forbidden: 'Tailwindの装飾クラス「{{ token }}」（{{ category }}）は規約により禁止されています。レイアウト（flex, gap, padding等）のみTailwindを使用し、装飾はScoped CSSにデザイントークンで定義してください。',
    },
    schema: [],
  },
  create(context) {
    function checkClassString(rawStr, reportNode) {
      if (!rawStr || typeof rawStr !== 'string') return
      const tokens = extractTokens(rawStr)

      for (let token of tokens) {
        if (token.startsWith('!')) token = token.slice(1)
        const cleanToken = token.replace(/^(sm|md|lg|xl|2xl|hover|focus|focus-visible|active|disabled):/, '')

        if (LAYOUT_EXACT.has(cleanToken)) continue

        for (const pattern of DECORATION_PATTERNS) {
          if (pattern.regex.test(cleanToken)) {
            context.report({
              node: reportNode,
              messageId: 'forbidden',
              data: {
                token,
                category: pattern.category,
              },
            })
            break
          }
        }
      }
    }

    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    return parserServices.defineTemplateBodyVisitor({
      VAttribute(node) {
        if (!node.directive && node.key.name === 'class' && node.value) {
          checkClassString(node.value.value, node)
        }
        else if (node.directive && node.key.name?.name === 'bind' && node.key.argument?.name === 'class' && node.value?.expression) {
          if (node.value.expression.type === 'Literal' && typeof node.value.expression.value === 'string') {
            checkClassString(node.value.expression.value, node)
          }
          else if (node.value.expression.type === 'ArrayExpression') {
            for (const el of node.value.expression.elements) {
              if (el && el.type === 'Literal' && typeof el.value === 'string') {
                checkClassString(el.value, el)
              }
            }
          }
          else if (node.value.expression.type === 'ObjectExpression') {
            for (const prop of node.value.expression.properties) {
              if (prop.key) {
                const keyName = prop.key.name || prop.key.value

                if (typeof keyName === 'string') {
                  checkClassString(keyName, prop.key)
                }
              }
            }
          }
        }
      },
    })
  },
}
