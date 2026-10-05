/**
 * strict-breadcrumbs-usage
 * [ESLint Custom Rule]
 * Vercel Geist Breadcrumbs ベストプラクティスに準拠した厳格な使用監視ルール
 * （※支援アクセシビリティ関連属性はプロジェクト規約により除外）
 *
 * 監視項目:
 * 1. items 属性の必須指定
 * 2. 直角規約違反（rounded-* クラスの付与禁止）
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist Breadcrumbs best practices strictly',
    },
    messages: {
      missingItems: '<Breadcrumbs> には :items 属性による項目配列のバインドが必須です。',
      forbiddenRoundedClass: '<Breadcrumbs> に対する「{{ token }}」は直角規約により禁止されています。',
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
        const isBreadcrumbs = node.rawName === 'Breadcrumbs' || node.name === 'Breadcrumbs' || node.name === 'breadcrumbs'

        if (!isBreadcrumbs) return

        const attributes = node.startTag?.attributes || []
        let hasItems = false

        for (const attr of attributes) {
          const isDirective = Boolean(attr.directive)
          const propName = isDirective ? attr.key?.argument?.name : attr.key?.name
          const rawVal = attr.value?.value

          if (propName === 'items') {
            hasItems = true
          }

          // --- 直角規約の検査 (rounded-* の禁止) ---
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

        if (!hasItems) {
          context.report({
            node,
            messageId: 'missingItems',
          })
        }
      },
    })
  },
}
