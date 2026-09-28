/**
 * strict-time-management
 * [ESLint Custom Rule]
 *
 * プロジェクト内の時間管理・日付処理アーキテクチャを機械的に強制・監視するルール。
 * 1. 素の new Date()（引数なし）による現在時刻取得の禁止（useAuth().getAccurateNow / getAccurateNowIso の使用を強制）
 * 2. toISOString().split('T')[0] による危険な日付抽出の禁止（formatToDateInputString の使用を強制）
 * 3. テンプレートリテラル等によるインライン手動日時フォーマットの禁止（formatDate / formatDateTime の使用を強制）
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce strict time management and safe date utilities in Nuxt/Vue app',
    },
    messages: {
      noRawNewDate: '引数なしの new Date() による現在時刻取得は禁止されています。端末時計の狂いによるタイムスタンプ汚染を防ぐため、useAuth().getAccurateNow() または getAccurateNowIso() を使用してください。',
      noIsoSplitDate: 'toISOString().split(\'T\')[0] による日付抽出は禁止されています。UTC変換による日付ズレ（0:00〜8:59 JSTでの前日化）を防ぐため、app/utils/date.ts の formatToDateInputString() を使用してください。',
      noInlineDateFormat: '手作業での日時文字列結合は禁止されています。フォーマットの一貫性を保つため、app/utils/date.ts の formatDate() または formatDateTime() を使用してください。',
    },
    schema: [],
  },
  create(context) {
    const rawFilename = context.filename || context.physicalFilename || ''
    const normalized = rawFilename.replace(/\\/g, '/')

    // 除外ファイル（テスト、E2E、サーバー、スクリプト、eslint-rules、日時基盤ユーティリティ等）
    if (
      normalized.includes('/tests/')
      || normalized.includes('/e2e/')
      || normalized.includes('/server/')
      || normalized.includes('/scripts/')
      || normalized.includes('/eslint-rules/')
      || normalized.includes('/node_modules/')
      || normalized.includes('/prisma/')
      || normalized.includes('/app/utils/db/')
      || normalized.endsWith('/app/utils/date.ts')
      || normalized.endsWith('/app/composables/useAuth.ts')
      || normalized.endsWith('/app/components/common/organisms/Footer.vue')
    ) {
      return {}
    }

    return {
      // 1. 引数なしの new Date() を検出
      NewExpression(node) {
        if (
          node.callee.type === 'Identifier'
          && node.callee.name === 'Date'
          && node.arguments.length === 0
        ) {
          context.report({
            node,
            messageId: 'noRawNewDate',
          })
        }
      },

      // 2. toISOString().split('T')[0] パターンを検出
      CallExpression(node) {
        if (
          node.callee.type === 'MemberExpression'
          && node.callee.property.type === 'Identifier'
          && node.callee.property.name === 'split'
          && node.arguments.length > 0
          && node.arguments[0].type === 'Literal'
          && node.arguments[0].value === 'T'
        ) {
          const obj = node.callee.object

          if (
            obj.type === 'CallExpression'
            && obj.callee.type === 'MemberExpression'
            && obj.callee.property.type === 'Identifier'
            && obj.callee.property.name === 'toISOString'
          ) {
            context.report({
              node,
              messageId: 'noIsoSplitDate',
            })
          }
        }
      },

      // 3. インラインでの getFullYear を含む日時文字列手動結合を検出
      TemplateLiteral(node) {
        const hasGetFullYear = node.expressions.some((expr) => {
          return (
            expr.type === 'CallExpression'
            && expr.callee.type === 'MemberExpression'
            && expr.callee.property.type === 'Identifier'
            && expr.callee.property.name === 'getFullYear'
          )
        })

        if (hasGetFullYear) {
          const rawText = node.quasis.map(q => q.value.raw).join('')

          if (rawText.includes('/') || rawText.includes('-') || rawText.includes(':')) {
            context.report({
              node,
              messageId: 'noInlineDateFormat',
            })
          }
        }
      },
    }
  },
}
