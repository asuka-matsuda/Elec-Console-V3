/**
 * strict-tabs-usage
 * [ESLint Custom Rule]
 * Vercel Geist Tabs ベストプラクティスに準拠した厳格な使用監視ルール
 *
 * 監視項目:
 * 1. 直角規約違反（<Tabs> に対する rounded-* クラスの付与禁止）
 * 2. 支援アクセシビリティ属性の禁止（aria-*, role 等の付与禁止。プロジェクト規約準拠）
 * 3. 生の tabs / tabs-item クラスによるインライン手動実装の禁止（共通 <Tabs> コンポーネントへの移行強制）
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist Tabs best practices strictly',
    },
    messages: {
      forbiddenRoundedClass: '<Tabs> に対する「{{ token }}」は直角規約（border-radius: 0）により禁止されています。',
      noAccessibility: '<Tabs> への純粋な支援アクセシビリティ属性（{{ attr }}）の付与はプロジェクト規約により禁止されています。',
      avoidInlineTabs: '「{{ className }}」による手動インラインタブ実装は禁止されています。共通 <Tabs :items="..." v-model="..." /> を使用してください。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename()

    // Tabs.vue 自体は内部実装のため除外
    if (filename.endsWith('Tabs.vue')) {
      return {}
    }

    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    return parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        const isTabsComponent = node.rawName === 'Tabs' || node.name === 'Tabs' || node.name === 'common-molecules-tabs'

        const attributes = node.startTag?.attributes || []

        if (isTabsComponent) {
          for (const attr of attributes) {
            // 1. 支援アクセシビリティ属性の監視
            const attrName = attr.directive ? attr.key?.argument?.name : attr.key?.name

            if (attrName) {
              if (attrName.startsWith('aria-') || attrName === 'role') {
                context.report({
                  node: attr,
                  messageId: 'noAccessibility',
                  data: { attr: attrName },
                })
              }
            }

            // 2. 直角規約の監視（静的 class）
            if (!attr.directive && attr.key?.name === 'class' && attr.value?.value) {
              const tokens = attr.value.value.split(/\s+/)

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
        }
        else {
          // 3. 生の tabs / tabs-item クラスによるインライン手動実装の監視
          for (const attr of attributes) {
            if (!attr.directive && attr.key?.name === 'class' && attr.value?.value) {
              const tokens = attr.value.value.split(/\s+/)

              for (const token of tokens) {
                if (token === 'tabs' || token === 'tabs-item') {
                  context.report({
                    node: attr,
                    messageId: 'avoidInlineTabs',
                    data: { className: token },
                  })
                }
              }
            }
          }
        }
      },
    })
  },
}
