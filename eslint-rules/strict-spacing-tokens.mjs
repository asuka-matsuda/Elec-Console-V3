/**
 * strict-spacing-tokens
 * [ESLint Custom Rule]
 * Vue テンプレート内の class / :class において、プロジェクト定義済みの
 * セマンティック余白トークン（および 0, auto, sidebar-w）以外の余白クラス
 * （p-*, m-*, gap-*, space-*）の使用を禁止するルール。
 */

const ALLOWED_MARGIN_SUFFIXES = new Set(['0', 'auto'])

const ALLOWED_SPACING_TOKENS = new Set([
  '0',
  'auto',
  'layout-pad',
  'section-gap',
  'panel-pad',
  'panel-pad-compact',
  'panel-gap',
  'form-row-gap',
  'form-col-gap',
  'item-gap',
  'inline-gap',
  'sidebar-w',
])

const SPACING_CLASS_REGEX = /^-?(p[trblxyse]?|m[trblxyse]?|gap(-[xy])?|space-[xy])-(.+)$/

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
      description: 'Enforce using strictly defined semantic spacing tokens in Vue templates',
    },
    messages: {
      unauthorizedSpacing: '未定義の余白クラス「{{ token }}」は使用禁止です。プロジェクト定義済みのセマンティック変数（layout-pad, section-gap, panel-pad, panel-pad-compact, panel-gap, form-row-gap, form-col-gap, item-gap, inline-gap, 0, auto）を使用してください。',
      forbiddenPanelPadding: '<Panel> に対する余白クラス「{{ token }}」の直接指定は禁止されています。余白は padding プロパティ（\'normal\' | \'compact\' | \'none\'）を使用してください。',
      forbiddenMargin: '要素間隔のためのマージン「{{ token }}」は禁止されています（Margin is harmful原則）。要素間の間隔は親コンテナの gap クラスを使用してください。margin はリセット（m-0）または端寄せ（ml-auto 等）のみ使用可能です。',
    },
    schema: [],
  },
  create(context) {
    function checkClassString(rawStr, reportNode) {
      if (!rawStr || typeof rawStr !== 'string') return
      const tokens = extractTokens(rawStr)

      // Panel 要素判定
      let curr = reportNode
      let vElement = null

      while (curr) {
        if (curr.type === 'VElement') {
          vElement = curr
          break
        }
        curr = curr.parent
      }

      const isPanel = vElement && ['Panel', 'AtomsPanel'].includes(vElement.rawName || vElement.name)

      for (let token of tokens) {
        if (token.startsWith('!')) token = token.slice(1)
        const cleanToken = token.replace(/^(sm|md|lg|xl|2xl|hover|focus|focus-visible|active|disabled|open):/, '')

        const match = cleanToken.match(SPACING_CLASS_REGEX)

        if (!match) continue

        const prefix = match[1]
        const suffix = match[3]

        // 1. Panelに対する余白クラス直接指定の禁止（padding プロパティ強制）
        if (isPanel && prefix.startsWith('p')) {
          context.report({
            node: reportNode,
            messageId: 'forbiddenPanelPadding',
            data: {
              token,
            },
          })
          continue
        }

        // 2. マージンの厳格ガード (Margin is harmful 原則)
        // m-0 (リセット) および *-auto (端寄せ) 以外のマージンを完全禁止
        if (prefix.startsWith('m')) {
          if (!ALLOWED_MARGIN_SUFFIXES.has(suffix)) {
            context.report({
              node: reportNode,
              messageId: 'forbiddenMargin',
              data: {
                token,
              },
            })
            continue
          }
        }

        // 3. 許可されたセマンティック余白トークンか検査
        if (!ALLOWED_SPACING_TOKENS.has(suffix)) {
          context.report({
            node: reportNode,
            messageId: 'unauthorizedSpacing',
            data: {
              token,
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
