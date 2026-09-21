/**
 * no-template-comments
 * [ESLint Custom Rule]
 * Vue SFC の <template> 内での HTML コメント (<!-- ... -->) の記述を禁止するルール。
 * テンプレートを常にクリーンに保ち、コンパイル時・レンダリング時の不要な DOM コメントノードの発生を防止します。
 */

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow HTML comments inside Vue SFC <template>',
    },
    messages: {
      noTemplateComment: 'Vue テンプレート内の HTML コメントは禁止されています。必要な設計意図や仕様は <script setup> 側の JSDoc/TSDoc またはインラインコメントとして記述してください。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.physicalFilename || ''

    if (!filename.endsWith('.vue')) {
      return {}
    }

    const sourceCode = context.sourceCode

    if (!sourceCode) return {}

    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    const templateTokenStore = parserServices.getTemplateBodyTokenStore?.()

    if (!templateTokenStore) return {}

    let reported = false

    return parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        if (reported) return
        // Only run once for the template by checking root element
        if (!node.parent || node.parent.type === 'VDocumentFragment') {
          reported = true
          const root = node.parent || node
          const tokens = templateTokenStore.getTokens(root, { includeComments: true })

          for (const token of tokens) {
            if (token.type === 'HTMLComment' || token.type.includes('Comment')) {
              const text = token.value.trim()

              if (text.startsWith('eslint-disable') || text.startsWith('eslint-enable')) {
                continue
              }
              context.report({
                loc: token.loc,
                messageId: 'noTemplateComment',
              })
            }
          }
        }
      },
    })
  },
}
