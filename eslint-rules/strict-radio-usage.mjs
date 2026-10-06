/**
 * strict-radio-usage
 * [ESLint Custom Rule]
 * Vercel Geist Radio ベストプラクティスに準拠した厳格な使用監視ルール
 * （※支援アクセシビリティ関連属性はプロジェクト規約により除外）
 *
 * 監視項目:
 * 1. ネイティブ <input type="radio"> の直書き禁止（共通 <Radio> を使用）
 * 2. 直角規約違反（rounded-* クラスの付与禁止）
 * 3. 支援アクセシビリティ属性の禁止（aria-*, role 等の付与禁止。プロジェクト規約準拠）
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist Radio best practices strictly',
    },
    messages: {
      noRawRadioInput: 'ネイティブの <input type="radio"> の直接記述は禁止されています。共通コンポーネント <Radio> を使用してください。',
      forbiddenRoundedClass: '<Radio> に対する「{{ token }}」は禁止されています。',
      noAccessibility: '<Radio> への純粋な支援アクセシビリティ属性（{{ attr }}）の付与はプロジェクト規約により禁止されています。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename()

    // Radio.vue 自体はスキップ
    if (filename.endsWith('Radio.vue')) {
      return {}
    }

    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    return parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        // 1. ネイティブ input[type="radio"] の検出
        if (node.rawName === 'input' || node.name === 'input') {
          const typeAttr = node.startTag?.attributes?.find(
            a => !a.directive && a.key?.name === 'type' && a.value?.value === 'radio',
          )

          if (typeAttr) {
            context.report({
              node,
              messageId: 'noRawRadioInput',
            })
          }

          return
        }

        const isRadio = node.rawName === 'Radio' || node.name === 'Radio' || node.name === 'common-atoms-radio'

        if (!isRadio) return

        const attributes = node.startTag?.attributes || []

        for (const attr of attributes) {
          const isDirective = Boolean(attr.directive)
          const propName = isDirective ? attr.key?.argument?.name : attr.key?.name
          const rawVal = attr.value?.value

          // 2. クラス属性の検査 (角丸の禁止)
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

          // 3. 支援アクセシビリティ属性の禁止
          if (propName && (propName.startsWith('aria-') || propName === 'role')) {
            context.report({
              node: attr,
              messageId: 'noAccessibility',
              data: { attr: propName },
            })
          }
        }
      },
    })
  },
}
