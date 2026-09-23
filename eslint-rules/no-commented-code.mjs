/**
 * no-commented-code
 * [ESLint Custom Rule]
 * コメントアウトされたコード片（デッドコード）、過去の実装への言及、
 * および自明なファイル名コメントの残留を検知・禁止するルール。
 * ※ tests/ 配下や、計算式・導出根拠メモ（I = ..., r = ... 等）は対象外とします。
 */

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow commented-out code fragments, past code references, and trivial filename comments',
    },
    messages: {
      noCommentedCode: 'コメントアウトされたコード片が検出されました。不要なコードは削除し、Git履歴で管理してください。',
      noPastCodeReference: '過去のコードへの言及（例: old code did... / 以前のコード）は禁止されています。現在の仕様根拠を記述してください。',
      noFilenameComment: '単なるファイル名のみのコメントは不要です。ファイルの責務を記述する JSDoc コメントに置き換えてください。',
    },
    schema: [],
  },
  create(context) {
    const rawFilename = context.filename || context.physicalFilename || ''
    const normalized = rawFilename.replace(/\\/g, '/')

    // Exclude test files and scripts
    if (normalized.includes('/tests/') || normalized.includes('/e2e/') || normalized.includes('/scripts/')) {
      return {}
    }

    const sourceCode = context.sourceCode

    if (!sourceCode) return {}

    // Patterns indicating code rather than natural language comments
    const codePattern = /^\s*(const|let|var|import\s+|export\s+|function\s+|class\s+|return\s+[a-zA-Z0-9_$]+;|await\s+[a-zA-Z0-9_$]+\(|console\.(log|warn|error)\(|if\s*\(.*?\)\s*\{|for\s*\(.*?\)\s*\{)\b/
    const pastCodePattern = /^\s*(the\s+old\s+code|old\s+code\s*:|以前のコード|過去の実装)/i
    const filenameCommentPattern = /^\s*[\w.-]+\.(ts|vue|js|mjs)\s*$/

    return {
      'Program:exit'() {
        const comments = sourceCode.getAllComments()

        for (const comment of comments) {
          const lines = comment.value.split('\n')

          for (const line of lines) {
            const trimmed = line.replace(/^\s*\*?\s*/, '').trim()

            // Skip directives, math equations, markdown, or ordinary sentences
            if (
              !trimmed
              || trimmed.startsWith('http')
              || trimmed.startsWith('@')
              || trimmed.startsWith('eslint-disable')
              || trimmed.startsWith('eslint-enable')
              || trimmed.startsWith('mode ===')
              || trimmed.startsWith('I =')
              || trimmed.startsWith('cablesWidth =')
            ) {
              continue
            }

            if (filenameCommentPattern.test(trimmed)) {
              context.report({
                loc: comment.loc,
                messageId: 'noFilenameComment',
              })
              break
            }

            if (pastCodePattern.test(trimmed)) {
              context.report({
                loc: comment.loc,
                messageId: 'noPastCodeReference',
              })
              break
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
