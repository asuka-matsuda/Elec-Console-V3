/**
 * no-redundant-vue-defaults
 * [ESLint Custom Rule]
 * Vue 3 の withDefaults において、不要な undefined デフォルト値や、
 * デフォルト値が存在しない不要な withDefaults 呼び出しを検知・禁止するルール。
 *
 * 理由:
 * TypeScript のオプショナルプロパティ（prop?: type）は未指定時自動的に undefined と解決されます。
 * withDefaults 内で明示的に prop: undefined と記述するのは冗長なおまじないです。
 * また、すべてのプロパティが undefined である場合は withDefaults 自体が不要です。
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow redundant undefined in withDefaults and unnecessary withDefaults calls',
    },
    messages: {
      redundantUndefined: 'オプショナルプロパティ「{{ propName }}」のデフォルト値に undefined を指定するのは冗長なおまじないです。プロパティ定義を削除してください。',
      unnecessaryWithDefaults: '有効なデフォルト値が1つも定義されていないため、withDefaults を削除して defineProps のみに簡素化してください。',
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'withDefaults') {
          const args = node.arguments

          if (args.length >= 2 && args[1].type === 'ObjectExpression') {
            const defaultsObj = args[1]
            const properties = defaultsObj.properties

            let undefinedCount = 0

            for (const prop of properties) {
              if (prop.type === 'Property') {
                const isValueUndefined = prop.value.type === 'Identifier' && prop.value.name === 'undefined'

                if (isValueUndefined) {
                  undefinedCount++
                  const propName = prop.key.name || prop.key.value || 'unknown'

                  context.report({
                    node: prop,
                    messageId: 'redundantUndefined',
                    data: { propName },
                  })
                }
              }
            }

            if (properties.length > 0 && undefinedCount === properties.length) {
              context.report({
                node,
                messageId: 'unnecessaryWithDefaults',
              })
            }
          }
          else if (args.length === 1 || (args.length >= 2 && args[1].type === 'ObjectExpression' && args[1].properties.length === 0)) {
            context.report({
              node,
              messageId: 'unnecessaryWithDefaults',
            })
          }
        }
      },
    }
  },
}
