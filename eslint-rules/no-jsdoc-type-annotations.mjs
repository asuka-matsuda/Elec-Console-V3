/**
 * no-jsdoc-type-annotations
 * [ESLint Custom Rule]
 * TypeScript プロジェクトにおいて、JSDoc コメント内の波括弧型注釈 ({type}) を禁止するルール。
 *
 * 理由: TypeScript ではコード側の型注釈が唯一の真実源 (SSoT) です。
 * JSDoc 内に @param {string} や @returns {Object} などの型を書くと、
 * 実装側の型が変更された際にコメントが更新されず食い違い（ドキュメント腐敗）の原因になります。
 * JSDoc には説明文（Why / 目的）のみを記述してください。
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow type annotations in JSDoc comments to prevent documentation drift in TypeScript code',
    },
    messages: {
      noJsdocTypeAnnotation: 'TypeScript では JSDoc 内の型注釈「{{ typeAnnotation }}」は禁止されています。型は TypeScript の型注釈に任せ、JSDoc にはパラメータ名と説明文のみを記述してください。',
    },
    schema: [],
  },
  create(context) {
    const rawFilename = context.filename || context.physicalFilename || ''
    const normalized = rawFilename.replace(/\\/g, '/')

    // Exclude tests, node_modules, .nuxt, etc.
    if (
      normalized.includes('/tests/')
      || normalized.includes('/e2e/')
      || normalized.includes('/.nuxt/')
      || normalized.includes('/.output/')
      || normalized.includes('/node_modules/')
      || normalized.includes('/eslint-rules/')
      || normalized.includes('/scripts/')
    ) {
      return {}
    }

    const sourceCode = context.sourceCode

    if (!sourceCode) return {}

    return {
      'Program:exit'(node) {
        const comments = sourceCode.getAllComments()

        comments.forEach((comment) => {
          if (comment.type !== 'Block' || !comment.value.startsWith('*')) {
            return
          }

          const regex = /@(?:param|returns?|type)\s*(\{[^}]+\})/g
          let match

          while ((match = regex.exec(comment.value)) !== null) {
            const typeAnnotation = match[1]

            // Calculate approximate line number of the comment
            const commentStartLine = comment.loc.start.line
            const textBeforeMatch = comment.value.slice(0, match.index)
            const matchLine = commentStartLine + textBeforeMatch.split('\n').length - 1

            context.report({
              node,
              loc: { line: matchLine, column: 0 },
              messageId: 'noJsdocTypeAnnotation',
              data: {
                typeAnnotation,
              },
            })
          }
        })
      },
    }
  },
}
