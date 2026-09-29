/**
 * strict-responsive-tokens
 * [ESLint Custom Rule]
 * Vue テンプレート内の class / :class において：
 * 1. 任意のブレイクポイント・コンテナ幅指定（max-[800px]:, @[500px]: 等のブラケット記法）の完全禁止
 * 2. プロジェクト定義済みのブレイクポイント・コンテナクエリトークンのみ許可
 * 3. デスクトップファースト原則に基づき、モバイルファースト（sm:, md: 等）を監視
 */

// モバイルファースト記法（デスクトップファースト違反検知用）
const MOBILE_FIRST_VARIANTS = new Set([
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  '@xs',
  '@sm',
  '@md',
  '@lg',
])

function extractTokens(classStr) {
  return classStr
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0 && !['true', 'false', 'null', 'undefined', 'return'].includes(t))
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce strict desktop-first responsive variants and disallow arbitrary breakpoint values in Vue templates',
    },
    messages: {
      unauthorizedArbitraryResponsive: 'ブレイクポイント／コンテナクエリの任意指定「{{ variant }}」は使用禁止です。定義済みのトークン（max-sm, max-md, max-lg, max-xl, max-2xl, @max-xs, @max-sm, @max-md, @max-lg）を使用してください。',
      forbiddenMobileFirst: 'モバイルファースト記法「{{ variant }}:」は非推奨です。デスクトップファースト原則に基づき「max-{{ cleanVariant }}:」または「@max-{{ cleanVariant }}:」を使用してください。',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowMobileFirst: {
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] || {}
    const allowMobileFirst = options.allowMobileFirst ?? false

    function checkClassString(rawStr, reportNode) {
      if (!rawStr || typeof rawStr !== 'string') return
      const tokens = extractTokens(rawStr)

      for (let token of tokens) {
        if (token.startsWith('!')) token = token.slice(1)

        const lastColonIndex = token.lastIndexOf(':')

        if (lastColonIndex === -1) continue

        const variantPart = token.slice(0, lastColonIndex)
        const variants = variantPart.split(':')

        for (const variant of variants) {
          // 1. 任意指定（max-[...], min-[...], @[...], @max-[...], @min-[...]）の完全禁止
          const isArbitrary = /^(max|min|@|@max|@min)-\[.+\]$/.test(variant) || /^@\[.+\]$/.test(variant)

          if (isArbitrary) {
            context.report({
              node: reportNode,
              messageId: 'unauthorizedArbitraryResponsive',
              data: {
                variant,
              },
            })
            continue
          }

          // 2. モバイルファースト記法の検知（デスクトップファーストへの統一監視）
          if (!allowMobileFirst && MOBILE_FIRST_VARIANTS.has(variant)) {
            const cleanVariant = variant.startsWith('@') ? variant.slice(1) : variant

            context.report({
              node: reportNode,
              messageId: 'forbiddenMobileFirst',
              data: {
                variant,
                cleanVariant,
              },
            })
          }
        }
      }
    }

    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) return {}

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
