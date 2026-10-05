/**
 * strict-checkbox-usage
 * [ESLint Custom Rule]
 * Vercel Geist Checkbox ベストプラクティスに準拠した厳格な使用監視ルール
 * （※支援アクセシビリティ関連属性はプロジェクト規約により除外）
 *
 * 監視項目:
 * 1. 廃止された variant prop の付与禁止（色の多態ではなく Geist 標準の外観を維持）
 * 2. 直角規約違反（rounded-* クラスの付与禁止）
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist Checkbox best practices strictly',
    },
    messages: {
      forbiddenVariant: '<Checkbox> の variant prop は廃止されました。Geist 仕様では単一の標準外観とし、カテゴリカラー等の特殊色指定には color prop を使用してください。',
      forbiddenRoundedClass: '<Checkbox> に対する「{{ token }}」は直角規約（border-radius: 0）により禁止されています。',
    },
    schema: [],
  },
  create(context) {
    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    return parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        const isCheckbox = node.rawName === 'Checkbox' || node.name === 'Checkbox' || node.name === 'checkbox'

        if (!isCheckbox) return

        const attributes = node.startTag?.attributes || []

        for (const attr of attributes) {
          const isDirective = Boolean(attr.directive)
          const propName = isDirective ? attr.key?.argument?.name : attr.key?.name
          const rawVal = attr.value?.value

          // --- 1. 廃止された variant の検査 ---
          if (propName === 'variant') {
            context.report({
              node: attr,
              messageId: 'forbiddenVariant',
            })
          }

          // --- 2. クラスの検査 (rounded-* の禁止) ---
          if (propName === 'class' && !isDirective && typeof rawVal === 'string') {
            const tokens = rawVal.split(/\s+/).filter(Boolean)

            for (const token of tokens) {
              if (token.startsWith('rounded')) {
                context.report({
                  node: attr,
                  messageId: 'forbiddenRoundedClass',
                  data: { token },
                })
              }
            }
          }
        }
      },
    })
  },
}
