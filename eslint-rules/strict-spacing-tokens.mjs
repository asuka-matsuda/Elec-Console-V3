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
  '0.5',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '8',
  '10',
  '12',
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
  'micro-gap',
  'sidebar-w',
])

const ALLOWED_PANEL_PADDING_CLASSES = new Set([
  'p-panel-pad-compact',
  'p-0',
])

const SPACING_CLASS_REGEX = /^-?(p[trblxyse]?|m[trblxyse]?|gap(-[xy])?|space-[xy])-(.+)$/

function extractTokens(classStr) {
  const tokens = []
  const regex = /(!?[\w\-.:]+(\[.+?\])?)/g
  let m

  while ((m = regex.exec(classStr)) !== null) {
    const token = m[1]

    if (['true', 'false', 'null', 'undefined', 'return'].includes(token)) continue
    tokens.push(token)
  }

  return tokens
}

function collectElementClassStrings(vElement) {
  if (!vElement?.startTag?.attributes) return []
  const strings = []

  function collectFromExpr(expr) {
    if (!expr) return
    if (expr.type === 'Literal' && typeof expr.value === 'string') {
      strings.push(expr.value)
    }
    else if (expr.type === 'TemplateLiteral') {
      for (const q of expr.quasis) {
        if (q.value?.raw) strings.push(q.value.raw)
      }
    }
    else if (expr.type === 'ArrayExpression') {
      for (const el of expr.elements) collectFromExpr(el)
    }
    else if (expr.type === 'ObjectExpression') {
      for (const prop of expr.properties) {
        const keyName = prop.key?.name || prop.key?.value

        if (typeof keyName === 'string') strings.push(keyName)
      }
    }
    else if (expr.type === 'ConditionalExpression') {
      collectFromExpr(expr.consequent)
      collectFromExpr(expr.alternate)
    }
    else if (expr.type === 'LogicalExpression') {
      collectFromExpr(expr.left)
      collectFromExpr(expr.right)
    }
  }

  for (const attr of vElement.startTag.attributes) {
    if (!attr.directive && attr.key.name === 'class' && attr.value?.value) {
      strings.push(attr.value.value)
    }
    else if (attr.directive && attr.key.name?.name === 'bind' && attr.key.argument?.name === 'class' && attr.value?.expression) {
      collectFromExpr(attr.value.expression)
    }
  }

  return strings
}

function hasPanelClass(vElement) {
  if (!vElement) return false
  const classStrings = collectElementClassStrings(vElement)

  for (const str of classStrings) {
    const tokens = extractTokens(str)

    if (tokens.includes('panel')) return true
  }

  return false
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce using strictly defined semantic spacing tokens in Vue templates',
    },
    messages: {
      unauthorizedSpacing: '未定義の余白クラス「{{ token }}」は使用禁止です。プロジェクト定義済みの余白トークン（layout-pad, section-gap, panel-pad, panel-pad-compact, panel-gap, form-row-gap, form-col-gap, item-gap, inline-gap, micro-gap, 0〜12, auto）を使用してください。',
      forbiddenPanelPadding: '.panel 要素に対する余白クラス「{{ token }}」の指定は禁止されています（標準余白は .panel に内包されています。コンパクト化には p-panel-pad-compact、余白なしには p-0 のみ使用可能です）。',
      forbiddenGapInPadding: 'パディングクラス「{{ token }}」に Gap 用トークン（*-gap）を使用することは禁止されています。サーフェス余白には *-pad（panel-pad-compact 等）、小要素の局所パディングにはプリミティブスケール（p-1, px-2 py-1 等）を使用してください。',
      forbiddenPadInGap: 'Gap クラス「{{ token }}」に Padding 用トークン（*-pad）を使用することは禁止されています。*-gap トークンまたはプリミティブスケールを使用してください。',
      forbiddenMargin: '要素間隔のためのマージン「{{ token }}」は禁止されています（Margin is harmful原則）。要素間の間隔は親コンテナの gap クラスを使用してください。margin はリセット（m-0）または端寄せ（ml-auto 等）のみ使用可能です。',
    },
    schema: [],
  },
  create(context) {
    function checkClassString(rawStr, reportNode) {
      if (!rawStr || typeof rawStr !== 'string') return
      const tokens = extractTokens(rawStr)

      // .panel 要素判定
      let curr = reportNode
      let vElement = null

      while (curr) {
        if (curr.type === 'VElement') {
          vElement = curr
          break
        }
        curr = curr.parent
      }

      const isPanel = hasPanelClass(vElement)

      for (let token of tokens) {
        if (token.startsWith('!')) token = token.slice(1)
        const cleanToken = token.replace(/^(@?max-[\w-]+|@[\w-]+|xs|sm|md|lg|xl|2xl|hover|focus|focus-visible|active|disabled|open):/, '')

        const match = cleanToken.match(SPACING_CLASS_REGEX)

        if (!match) continue

        const prefix = match[1]
        const suffix = match[3]

        // 1. マージンの厳格ガード (Margin is harmful 原則)
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

        // 2. 許可されたセマンティック余白トークンか検査
        if (!ALLOWED_SPACING_TOKENS.has(suffix)) {
          context.report({
            node: reportNode,
            messageId: 'unauthorizedSpacing',
            data: {
              token,
            },
          })
          continue
        }

        // 3. Padding (p-*) に対する *-gap トークン流用の禁止
        if (prefix.startsWith('p') && suffix.endsWith('-gap')) {
          context.report({
            node: reportNode,
            messageId: 'forbiddenGapInPadding',
            data: {
              token,
            },
          })
          continue
        }

        // 4. Gap (gap-* / space-*) に対する *-pad トークン流用の禁止
        if ((prefix.startsWith('gap') || prefix.startsWith('space')) && (suffix.endsWith('-pad') || suffix.endsWith('-pad-compact'))) {
          context.report({
            node: reportNode,
            messageId: 'forbiddenPadInGap',
            data: {
              token,
            },
          })
          continue
        }

        // 5. .panel に対する p-panel-pad-compact / p-0 以外のパディング指定禁止
        if (isPanel && prefix.startsWith('p') && !ALLOWED_PANEL_PADDING_CLASSES.has(cleanToken)) {
          context.report({
            node: reportNode,
            messageId: 'forbiddenPanelPadding',
            data: {
              token,
            },
          })
        }
      }
    }

    function traverseExpression(expr, reportNode) {
      if (!expr) return

      if (expr.type === 'Literal' && typeof expr.value === 'string') {
        checkClassString(expr.value, reportNode || expr)
      }
      else if (expr.type === 'TemplateLiteral') {
        for (const quasi of expr.quasis) {
          if (quasi.value?.raw) {
            checkClassString(quasi.value.raw, reportNode || quasi)
          }
        }
      }
      else if (expr.type === 'ArrayExpression') {
        for (const el of expr.elements) {
          if (el) traverseExpression(el, el)
        }
      }
      else if (expr.type === 'ObjectExpression') {
        for (const prop of expr.properties) {
          if (prop.key) {
            const keyName = prop.key.name || prop.key.value

            if (typeof keyName === 'string') {
              checkClassString(keyName, prop.key)
            }
          }
        }
      }
      else if (expr.type === 'ConditionalExpression') {
        traverseExpression(expr.consequent, expr.consequent)
        traverseExpression(expr.alternate, expr.alternate)
      }
      else if (expr.type === 'LogicalExpression') {
        traverseExpression(expr.left, expr.left)
        traverseExpression(expr.right, expr.right)
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
          traverseExpression(node.value.expression, node)
        }
      },
    })
  },
}
