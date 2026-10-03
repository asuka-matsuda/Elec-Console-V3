/**
 * no-event-pass-through
 * [ESLint Custom Rule]
 * 子コンポーネントから受け取ったイベントを、何もしないで親へそのまま再送出（emit / $emit）する
 * 「イベントのバケツリレー（Event Drilling）」を禁止するルール。
 *
 * 理由: 中間コンポーネントがイベントをただ横流しするだけの構造は、Props/Emits の二重管理を生み、
 * 追跡困難なバケツリレーの原因となります。状態やハンドラを Composable に直接持たせるか、
 * 画面へインライン記述してください。
 */

function toKebabCase(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

function extractCallExpression(expr) {
  if (!expr) return null
  if (expr.type === 'CallExpression') return expr

  // Vue inline statement: VOnExpression -> body[] -> ExpressionStatement -> CallExpression
  if (expr.type === 'VOnExpression' && expr.body && expr.body.length > 0) {
    const first = expr.body[0]

    if (first.type === 'ExpressionStatement' && first.expression?.type === 'CallExpression') {
      return first.expression
    }
  }

  // Arrow function: () => emit(...)
  if (expr.type === 'ArrowFunctionExpression' && expr.body) {
    if (expr.body.type === 'CallExpression') return expr.body
    if (expr.body.type === 'BlockStatement' && expr.body.body?.[0]?.type === 'ExpressionStatement') {
      if (expr.body.body[0].expression?.type === 'CallExpression') {
        return expr.body.body[0].expression
      }
    }
  }

  return null
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow trivial event pass-through where a component merely re-emits child events to its parent',
    },
    messages: {
      noEventPassThrough: '子コンポーネント（<{{ componentName }}>）のイベント「{{ eventName }}」を親へそのまま emit して中継（バケツリレー）することは禁止されています。Composable を直接参照して状態を更新するか、親コンポーネントへインライン化してください。',
    },
    schema: [],
  },
  create(context) {
    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    return parserServices.defineTemplateBodyVisitor({
      VAttribute(node) {
        if (!node.directive || node.key.name?.name !== 'on') {
          return
        }

        const eventName = node.key.argument?.name

        if (!eventName) return

        // 祖先のタグをチェック（HTMLネイティブ要素のクリックなどは除外、大文字から始まるコンポーネントを対象）
        const parentElement = node.parent?.parent

        if (!parentElement || parentElement.type !== 'VElement') return
        const parentTagName = parentElement.rawName || parentElement.name

        // 小文字のみの標準HTMLタグ（button, div, input等）は除外
        if (/^[a-z]+$/.test(parentTagName)) {
          return
        }

        const expr = node.value?.expression

        if (!expr) return

        const callExpr = extractCallExpression(expr)

        if (!callExpr) return

        const callee = callExpr.callee

        if (callee.type !== 'Identifier' || (callee.name !== 'emit' && callee.name !== '$emit')) {
          return
        }

        const firstArg = callExpr.arguments?.[0]

        if (!firstArg || (firstArg.type !== 'Literal' && firstArg.type !== 'StringLiteral')) {
          return
        }

        const emittedEventName = String(firstArg.value)
        const normListening = toKebabCase(eventName)
        const normEmitting = toKebabCase(emittedEventName)

        if (normListening === normEmitting) {
          context.report({
            node,
            messageId: 'noEventPassThrough',
            data: {
              componentName: parentTagName,
              eventName,
            },
          })
        }
      },
    })
  },
}
