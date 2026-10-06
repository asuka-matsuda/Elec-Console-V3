/**
 * strict-progress-usage
 * [ESLint Custom Rule]
 * Vercel Geist Progress ベストプラクティスに準拠した厳格な使用監視ルール
 *
 * 監視項目:
 * 1. 直角規約違反（<Progress> に対する rounded-* クラスの付与禁止）
 * 2. 支援アクセシビリティ属性の禁止（aria-*, role 等の付与禁止。プロジェクト規約準拠）
 * 3. 許可サイズ規約（size は sm / md / lg のみ許可）
 * 4. 旧コンポーネント（ProgressBar / PortalProgressBar）の使用禁止（共通 <Progress> への移行強制）
 */

const ALLOWED_SIZES = new Set(['sm', 'md', 'lg'])

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist Progress best practices strictly',
    },
    messages: {
      forbiddenRoundedClass: '<Progress> に対する「{{ token }}」は直角規約（border-radius: 0）により禁止されています。',
      noAccessibility: '<Progress> への純粋な支援アクセシビリティ属性（{{ attr }}）の付与はプロジェクト規約により禁止されています。',
      invalidSize: '<Progress> の size には「{{ size }}」は使用できません。"sm" | "md" | "lg" を指定してください。',
      avoidObsoleteComponent: '旧「{{ name }}」は廃止されました。共通 <Progress :value="..." /> を使用してください。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename()

    // Progress.vue 自体は内部実装のため除外
    if (filename.endsWith('Progress.vue')) {
      return {}
    }

    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    return parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        const isProgress = node.rawName === 'Progress' || node.name === 'Progress' || node.name === 'common-atoms-progress'
        const isObsoleteProgress = node.rawName === 'ProgressBar'
          || node.name === 'ProgressBar'
          || node.rawName === 'PortalProgressBar'
          || node.name === 'PortalProgressBar'
          || node.name === 'portal-souden-progress-bar'

        if (isObsoleteProgress) {
          context.report({
            node,
            messageId: 'avoidObsoleteComponent',
            data: { name: node.rawName || node.name },
          })

          return
        }

        if (!isProgress) return

        const attributes = node.startTag?.attributes || []

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

          // 3. size プロップの検証
          if (!attr.directive && attr.key?.name === 'size' && attr.value?.value) {
            const sizeVal = attr.value.value

            if (!ALLOWED_SIZES.has(sizeVal)) {
              context.report({
                node: attr,
                messageId: 'invalidSize',
                data: { size: sizeVal },
              })
            }
          }
        }
      },
    })
  },
}
