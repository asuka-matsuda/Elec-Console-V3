/**
 * strict-state-management
 * [ESLint Custom Rule]
 *
 * プロジェクト内の状態管理・API通信アーキテクチャを機械的に強制・監視するルール。
 * 1. 素の $fetch 呼び出しの禁止（useApi().$api の使用を強制）
 * 2. useState への文字列リテラル直接指定の禁止（STATE_KEYS からの参照を強制）
 * 3. Vue コンポーネント内での直接 $api 通信の禁止（Composable 経由を強制）
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce strict state management and API client conventions in Nuxt/Vue app',
    },
    messages: {
      noRawFetch: '素の $fetch 呼び出しは禁止されています。認証トークン自動付与・401エラーハンドリング・AppException正規化を保証するため、useApi().$api を使用してください。',
      noRawStateKey: 'useState に文字列リテラルを直接指定することは禁止されています。キーの重複やタイポを防ぐため、app/constants/storageKeys.ts の STATE_KEYS を使用してください。',
      noApiInComponent: 'Vue コンポーネント内での直接の API 通信は禁止されています。表示層の責務を保つため、Composable 経由でデータを取得・操作してください。',
    },
    schema: [],
  },
  create(context) {
    const rawFilename = context.filename || context.physicalFilename || ''
    const normalized = rawFilename.replace(/\\/g, '/')

    // 除外ディレクトリ（テスト、E2E、サーバー、スクリプト、eslint-rules、プラグイン等）
    if (
      normalized.includes('/tests/')
      || normalized.includes('/e2e/')
      || normalized.includes('/server/')
      || normalized.includes('/scripts/')
      || normalized.includes('/eslint-rules/')
      || normalized.includes('/node_modules/')
      || normalized.includes('/app/plugins/api.ts')
    ) {
      return {}
    }

    const isInsideApp = normalized.includes('/app/')
    const isComponent = normalized.includes('/app/components/')

    return {
      CallExpression(node) {
        if (!isInsideApp) return

        const callee = node.callee

        // 1. 素の $fetch 呼び出しの禁止
        if (callee.type === 'Identifier' && callee.name === '$fetch') {
          context.report({
            node,
            messageId: 'noRawFetch',
          })
        }

        // 2. useState への文字列リテラルの直接指定を禁止（STATE_KEYS 参照を強制）
        if (callee.type === 'Identifier' && callee.name === 'useState') {
          const firstArg = node.arguments[0]

          if (firstArg) {
            // 文字列リテラル または テンプレートリテラル（`key-${id}`）の直接記述を禁止
            if (
              firstArg.type === 'Literal'
              || firstArg.type === 'TemplateLiteral'
            ) {
              context.report({
                node: firstArg,
                messageId: 'noRawStateKey',
              })
            }
          }
        }

        // 3. コンポーネント内での useApi / $api 直接呼び出しの禁止
        if (isComponent) {
          if (
            (callee.type === 'Identifier' && (callee.name === 'useApi' || callee.name === '$api'))
            || (callee.type === 'MemberExpression' && callee.property.type === 'Identifier' && callee.property.name === '$api')
          ) {
            context.report({
              node,
              messageId: 'noApiInComponent',
            })
          }
        }
      },
    }
  },
}
