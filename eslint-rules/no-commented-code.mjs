/**
 * no-commented-code
 * [ESLint Custom Rule]
 * コメントアウトされたコード片（デッドコード）の残留を検知・禁止するルール。
 * ※ tests/ 配下や、計算式・導出根拠メモ（I = ..., r = ... 等）は対象外とします。
 */

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow commented-out code fragments',
    },
    messages: {
      noCommentedCode: 'コメントアウトされたコードが検出されました。不要なコードは削除し、Git履歴で管理してください。',
    },
    schema: [],
  },
  create(context) {
    const rawFilename = context.filename || context.physicalFilename || ''
    const normalized = rawFilename.replace(/\\/g, '/')

    // Exclude test files
    if (normalized.includes('/tests/')) {
      return {}
    }

    const sourceCode = context.sourceCode

    if (!sourceCode) return {}

    // Patterns indicating code rather than natural language comments
    const codePattern = /^\s*(const|let|var|import\s+|export\s+|function\s+|class\s+|return\s+[a-zA-Z0-9_$]+;|await\s+[a-zA-Z0-9_$]+\(|console\.(log|warn|error)\(|if\s*\(.*?\)\s*\{|for\s*\(.*?\)\s*\{)\b/

    return {
      'Program:exit'() {
        const comments = sourceCode.getAllComments()

        for (const comment of comments) {
          const lines = comment.value.split('\n')

          for (const line of lines) {
            const trimmed = line.replace(/^\s*\*?\s*/, '').trim()

            // Skip directives, math equations, markdown, or ordinary sentences
            if (!trimmed || trimmed.startsWith('http') || trimmed.startsWith('@') || trimmed.startsWith('mode ===') || trimmed.startsWith('I =') || trimmed.startsWith('cablesWidth =')) {
              continue
            }

            if (codePattern.test(trimmed)) {
              context.report({
                loc: comment.loc,
                messageId: 'noCommentedCode',
              })
              break
            }
          }
        }
      },
    }
  },
}
