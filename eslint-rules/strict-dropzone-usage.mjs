/**
 * strict-dropzone-usage
 * [ESLint Custom Rule]
 * Vercel Geist Dropzone ベストプラクティスに準拠した厳格な使用監視ルール
 * （※支援アクセシビリティ関連属性はプロジェクト規約により除外）
 *
 * 監視項目:
 * 1. 廃止された旧 ExcelDropzone / PortalExcelDropzone の使用禁止（<Dropzone> を使用）
 * 2. 直角規約違反（rounded-* クラスの付与禁止）
 * 3. 支援アクセシビリティ属性の禁止（aria-*, role 等の付与禁止。プロジェクト規約準拠）
 * 4. 二重 label（<label> 内での <Dropzone> 配置禁止）
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist Dropzone best practices strictly',
    },
    messages: {
      deprecatedExcelDropzone: '<{{ name }}> は廃止されました。共通の <Dropzone> コンポーネントを使用してください。',
      forbiddenRoundedClass: '<Dropzone> に対する「{{ token }}」は直角規約（border-radius: 0）により禁止されています。',
      noAccessibility: '<Dropzone> への純粋な支援アクセシビリティ属性（{{ attr }}）の付与はプロジェクト規約により禁止されています。',
      nestedInsideLabel: '<Dropzone> は内部に <label> を持っているため、<label> 内に配置することは仕様違反（二重Label）です。外側の <label> を除去してください。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename()

    // Dropzone.vue 自体はスキップ
    if (filename.endsWith('Dropzone.vue')) {
      return {}
    }

    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    return parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        const rawName = node.rawName || node.name

        // 1. 廃止コンポーネント検知
        if (
          rawName === 'ExcelDropzone'
          || rawName === 'PortalExcelDropzone'
          || rawName === 'excel-dropzone'
          || rawName === 'portal-excel-dropzone'
        ) {
          context.report({
            node,
            messageId: 'deprecatedExcelDropzone',
            data: { name: rawName },
          })

          return
        }

        const isDropzone = rawName === 'Dropzone' || rawName === 'dropzone' || rawName === 'common-molecules-dropzone'

        if (!isDropzone) return

        // 2. 二重 label の検査（祖先に label が存在するか）
        let parent = node.parent

        while (parent) {
          if (parent.type === 'VElement') {
            const pName = parent.rawName || parent.name

            if (pName === 'label') {
              context.report({
                node,
                messageId: 'nestedInsideLabel',
              })
              break
            }
          }
          parent = parent.parent
        }

        const attributes = node.startTag?.attributes || []

        for (const attr of attributes) {
          const isDirective = Boolean(attr.directive)
          const propName = isDirective ? attr.key?.argument?.name : attr.key?.name
          const rawVal = attr.value?.value

          // 3. クラスの検査 (rounded-* の禁止)
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

          // 4. 支援アクセシビリティ属性の禁止
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
