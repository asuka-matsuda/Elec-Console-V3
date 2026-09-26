/**
 * strict-ui-states
 * [ESLint Custom Rule]
 *
 * Vue テンプレート内の class / :class において、プロジェクト統一の状態管理規約を強制するルール。
 * 1. ホバー状態「is-hover」の禁止（CSS の &:hover 疑似クラスに一任）
 * 2. プレフィックス無しの素の状態クラス（active, selected, open, disabled, loading, error 等）の禁止
 * 3. 廃止・重複状態クラス（is-selected, is-current）の禁止（「is-active」への一本化）
 * 4. 開閉フラグ（isOpen 等）に対する「is-active」の誤用の禁止（「is-open」を強制）
 */

const FORBIDDEN_BARE_STATES = new Set([
  'active',
  'selected',
  'open',
  'disabled',
  'loading',
  'error',
])

const DEPRECATED_STATES = new Set([
  'is-selected',
  'is-current',
])

function extractClassTokens(rawStr) {
  if (!rawStr || typeof rawStr !== 'string') return []
  const tokens = []
  const regex = /(!?[\w\-:]+(\[.+?\])?)/g
  let m

  while ((m = regex.exec(rawStr)) !== null) {
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
      description: 'Enforce unified UI state classes (is-active, is-open, etc.) in Vue templates',
    },
    messages: {
      forbiddenIsHover: 'ホバー状態「is-hover」のクラス指定は禁止されています。CSSの「&:hover」疑似クラスを使用してください。',
      forbiddenBareState: 'プレフィックス無しの状態クラス「{{ name }}」は禁止されています。「is-{{ name }}」を使用してください。',
      forbiddenDeprecatedState: '状態クラス「{{ name }}」は非推奨です。アクティブ・選択・カレント状態は「is-active」に統一してください。',
      forbiddenActiveForOpen: '開閉フラグに対して「is-active」を使用することは禁止されています。「is-open」を使用してください。',
    },
    schema: [],
  },
  create(context) {
    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    function inspectToken(token, reportNode) {
      if (!token || typeof token !== 'string') return

      let clean = token

      if (clean.startsWith('!')) clean = clean.slice(1)
      clean = clean.replace(/^(sm|md|lg|xl|2xl|hover|focus|focus-visible|active|disabled|open):/, '')

      if (clean === 'is-hover') {
        context.report({
          node: reportNode,
          messageId: 'forbiddenIsHover',
        })

        return
      }

      if (DEPRECATED_STATES.has(clean)) {
        context.report({
          node: reportNode,
          messageId: 'forbiddenDeprecatedState',
          data: { name: clean },
        })

        return
      }

      if (FORBIDDEN_BARE_STATES.has(clean)) {
        context.report({
          node: reportNode,
          messageId: 'forbiddenBareState',
          data: { name: clean },
        })
      }
    }

    function inspectExpression(expr) {
      if (!expr) return

      if (expr.type === 'Literal' && typeof expr.value === 'string') {
        const tokens = extractClassTokens(expr.value)

        for (const token of tokens) {
          inspectToken(token, expr)
        }
      }
      else if (expr.type === 'ArrayExpression') {
        for (const element of expr.elements) {
          if (element) {
            inspectExpression(element)
          }
        }
      }
      else if (expr.type === 'ObjectExpression') {
        for (const prop of expr.properties) {
          if (prop && prop.key) {
            const keyName = prop.key.name || prop.key.value

            if (typeof keyName === 'string') {
              inspectToken(keyName, prop.key)

              // 開閉フラグに対して is-active を使っていないか検査
              if (keyName === 'is-active' && prop.value) {
                let isLikelyOpenFlag = false

                if (prop.value.type === 'Identifier' && /^(is)?Open$/i.test(prop.value.name)) {
                  isLikelyOpenFlag = true
                }
                else if (
                  prop.value.type === 'MemberExpression'
                  && prop.value.property?.type === 'Identifier'
                  && /^(is)?Open$/i.test(prop.value.property.name)
                ) {
                  isLikelyOpenFlag = true
                }

                if (isLikelyOpenFlag) {
                  context.report({
                    node: prop.key,
                    messageId: 'forbiddenActiveForOpen',
                  })
                }
              }
            }
          }
        }
      }
    }

    return parserServices.defineTemplateBodyVisitor({
      VAttribute(node) {
        if (!node.directive && node.key.name === 'class' && node.value) {
          const tokens = extractClassTokens(node.value.value)

          for (const token of tokens) {
            inspectToken(token, node)
          }
        }
        else if (
          node.directive
          && node.key.name?.name === 'bind'
          && node.key.argument?.name === 'class'
          && node.value?.expression
        ) {
          inspectExpression(node.value.expression)
        }
      },
    })
  },
}
