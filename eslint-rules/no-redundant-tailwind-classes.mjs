/**
 * no-redundant-tailwind-classes
 * [ESLint Custom Rule]
 * CSS初期値やプロジェクトのリセットCSS（destyle / _base.scss）ですでに保証されている、
 * 「おまじない的」な冗長Tailwindクラスを検知・禁止するルール。
 *
 * 監視対象:
 * 1. items-stretch: flex / grid の初期値は stretch のため冗長
 * 2. list-none: _reset.scss で全リスト要素がリセット済みのため冗長
 * 3. flex-shrink-0: プロジェクト規約に基づき shrink-0 に統一
 * 4. 静的要素 (h1~h6, p, small, dl, dt, dd, ul, ol, form, hr) に対する m-0 / p-0:
 *    _base.scss で全要素 margin/padding が 0 にリセットされているため冗長
 */

const STATIC_RESET_ELEMENTS = new Set([
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'small',
  'dl',
  'dt',
  'dd',
  'ul',
  'ol',
  'form',
  'hr',
])

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
      description: 'Disallow redundant Tailwind CSS classes that duplicate CSS initial values or global reset',
    },
    messages: {
      redundantStretch: '「{{ token }}」は flex / grid の初期値（align-items: stretch）のため、冗長なおまじないです。削除してください。',
      redundantListNone: '「{{ token }}」は _reset.scss によりすでに list-style: none にリセットされているため、冗長なおまじないです。削除してください。',
      preferShrink0: '「{{ token }}」はプロジェクト規約に基づき「shrink-0」に統一してください。',
      redundantStaticSpacing: '<{{ element }}> に対する「{{ token }}」は _base.scss で全要素リセット（margin: 0, padding: 0）されているため冗長です。削除してください。',
    },
    schema: [],
  },
  create(context) {
    function checkClassTokens(rawStr, reportNode, vElement) {
      if (!rawStr || typeof rawStr !== 'string') return
      const tokens = extractTokens(rawStr)

      for (let token of tokens) {
        if (token.startsWith('!')) token = token.slice(1)
        const cleanToken = token.replace(/^(sm|md|lg|xl|2xl|hover|focus|focus-visible|active|disabled):/, '')

        // 1. items-stretch
        if (cleanToken === 'items-stretch') {
          context.report({
            node: reportNode,
            messageId: 'redundantStretch',
            data: { token },
          })
        }

        // 2. list-none
        if (cleanToken === 'list-none') {
          context.report({
            node: reportNode,
            messageId: 'redundantListNone',
            data: { token },
          })
        }

        // 3. flex-shrink-0 -> shrink-0
        if (cleanToken === 'flex-shrink-0') {
          context.report({
            node: reportNode,
            messageId: 'preferShrink0',
            data: { token },
          })
        }

        // 4. 静的要素に対する m-0 / p-0
        if (vElement && STATIC_RESET_ELEMENTS.has(vElement.rawName || vElement.name)) {
          if (cleanToken === 'm-0' || cleanToken === 'p-0') {
            context.report({
              node: reportNode,
              messageId: 'redundantStaticSpacing',
              data: {
                element: vElement.rawName || vElement.name,
                token,
              },
            })
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
        // 親の VElement を取得
        let curr = node
        let vElement = null

        while (curr) {
          if (curr.type === 'VElement') {
            vElement = curr
            break
          }
          curr = curr.parent
        }

        if (!node.directive && node.key.name === 'class' && node.value) {
          checkClassTokens(node.value.value, node, vElement)
        }
        else if (node.directive && node.key.name?.name === 'bind' && node.key.argument?.name === 'class' && node.value?.expression) {
          if (node.value.expression.type === 'Literal' && typeof node.value.expression.value === 'string') {
            checkClassTokens(node.value.expression.value, node, vElement)
          }
          else if (node.value.expression.type === 'ArrayExpression') {
            for (const el of node.value.expression.elements) {
              if (el && el.type === 'Literal' && typeof el.value === 'string') {
                checkClassTokens(el.value, el, vElement)
              }
            }
          }
          else if (node.value.expression.type === 'ObjectExpression') {
            for (const prop of node.value.expression.properties) {
              if (prop.key) {
                const keyName = prop.key.name || prop.key.value

                if (typeof keyName === 'string') {
                  checkClassTokens(keyName, prop.key, vElement)
                }
              }
            }
          }
        }
      },
    })
  },
}
