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
  { category: '挙動/インタラクション', regex: /^(pointer-events-(none|auto)|select-(none|text|all|auto)|resize(-[xynone])?)$/ },
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
      description: 'Disallow non-layout Tailwind CSS classes in templates and redundant sizing',
    },
    messages: {
      forbidden: 'Tailwindの装飾・挙動クラス「{{ token }}」（{{ category }}）は規約により禁止されています。レイアウト（flex, gap, padding等）のみTailwindを使用し、装飾や挙動はScoped CSSに定義してください。',
      redundantSizing: '「{{ insetToken }}」が指定されているため、「{{ token }}」の指定は冗長です。削除してください。',
      forbiddenPanelP0: '<Panel> に対する「{{ token }}」の打ち消し指定は禁止されています。余白をゼロにする場合は padding="none" プロパティを使用してください。',
    },
    schema: [],
  },
  create(context) {
    function checkClassString(rawStr, reportNode) {
      if (!rawStr || typeof rawStr !== 'string') return
      const tokens = extractTokens(rawStr)

      const cleanTokens = []

      for (let token of tokens) {
        if (token.startsWith('!')) token = token.slice(1)
        const cleanToken = token.replace(/^(sm|md|lg|xl|2xl|hover|focus|focus-visible|active|disabled):/, '')

        cleanTokens.push({ raw: token, clean: cleanToken })

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

      // inset-0 / inset-x-0 / inset-y-0 と w-full / h-full の冗長な重複指定を検知
      const cleanList = cleanTokens.map(t => t.clean)
      const hasInset0 = cleanList.includes('inset-0')
      const hasInsetX0 = cleanList.includes('inset-x-0')
      const hasInsetY0 = cleanList.includes('inset-y-0')

      const wFullToken = cleanTokens.find(t => t.clean === 'w-full')

      if ((hasInset0 || hasInsetX0) && wFullToken) {
        context.report({
          node: reportNode,
          messageId: 'redundantSizing',
          data: {
            insetToken: hasInset0 ? 'inset-0' : 'inset-x-0',
            token: wFullToken.raw,
          },
        })
      }

      const hFullToken = cleanTokens.find(t => t.clean === 'h-full')

      if ((hasInset0 || hasInsetY0) && hFullToken) {
        context.report({
          node: reportNode,
          messageId: 'redundantSizing',
          data: {
            insetToken: hasInset0 ? 'inset-0' : 'inset-y-0',
            token: hFullToken.raw,
          },
        })
      }

      // <Panel> に対する p-0 の打ち消し指定を検知
      let curr = reportNode
      let vElement = null

      while (curr) {
        if (curr.type === 'VElement') {
          vElement = curr
          break
        }
        curr = curr.parent
      }

      if (vElement && (vElement.rawName === 'Panel' || vElement.name === 'Panel' || vElement.rawName === 'AtomsPanel' || vElement.name === 'AtomsPanel')) {
        const p0Token = cleanTokens.find(t => t.clean === 'p-0')

        if (p0Token) {
          context.report({
            node: reportNode,
            messageId: 'forbiddenPanelP0',
            data: {
              token: p0Token.raw,
            },
          })
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
