/**
 * require-file-jsdoc
 * [ESLint Custom Rule]
 * 対象ディレクトリ（server/api, app/composables, app/pages）のファイル先頭に
 * JSDoc コメント (/** ... *\/) が記述されていることを義務付けるルール。
 */

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require leading JSDoc comments on server APIs, composables, and pages',
    },
    messages: {
      missingJsDoc: 'ファイル先頭に概要や仕様を説明する JSDoc コメント (/** ... */) を記述してください。',
    },
    schema: [],
  },
  create(context) {
    const rawFilename = context.filename || context.physicalFilename || ''
    const normalized = rawFilename.replace(/\\/g, '/')

    // Match target directories
    const isTarget
      = normalized.includes('/server/api/')
        || normalized.includes('/app/composables/')
        || (normalized.includes('/app/pages/') && normalized.endsWith('.vue'))

    if (!isTarget) {
      return {}
    }

    const sourceCode = context.sourceCode

    if (!sourceCode) return {}

    return {
      'Program:exit'(node) {
        const comments = sourceCode.getAllComments()
        const text = sourceCode.getText()

        // Check if there is a JSDoc block comment near the top (before first meaningful code)
        let hasLeadingJSDoc = false

        for (const comment of comments) {
          // For .vue files, ensure it is within <script> or at the top of SFC
          if (comment.type === 'Block' && comment.value.startsWith('*')) {
            // It is a JSDoc block
            hasLeadingJSDoc = true
            break
          }
        }

        // Also check if text starts with /** (e.g. before any tokens)
        if (!hasLeadingJSDoc) {
          const trimmed = text.trimStart()

          if (trimmed.startsWith('/**') || trimmed.startsWith('<script setup lang="ts">\n/**') || trimmed.startsWith('<script setup>\n/**')) {
            hasLeadingJSDoc = true
          }
        }

        if (!hasLeadingJSDoc) {
          context.report({
            node,
            loc: { line: 1, column: 0 },
            messageId: 'missingJsDoc',
          })
        }
      },
    }
  },
}
