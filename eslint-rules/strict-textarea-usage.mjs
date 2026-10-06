/**
 * strict-textarea-usage
 * [ESLint Custom Rule]
 * Vercel Geist Textarea ベストプラクティスに準拠した厳格な使用監視ルール
 * （※支援アクセシビリティ関連属性はプロジェクト規約により除外）
 *
 * 監視項目:
 * 1. 直角規約違反（rounded-* クラスの付与禁止）
 * 2. サイズ指定の検証（sm / md / lg のみ許可）
 * 3. 外部からのフォントサイズ・パディング上書き禁止（text-*, p-* 等の付与禁止）
 * 4. 支援アクセシビリティ属性の禁止（aria-*, role 等の付与禁止。プロジェクト規約準拠）
 */

const VALID_SIZES = new Set(['sm', 'md', 'lg'])

const TEXT_SIZE_PATTERN = /^text-(xs|sm|base|lg|xl|[2-9]xl|\[\d+px\])$/
const PADDING_PATTERN = /^p[xytrbl]?-/

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist Textarea best practices strictly',
    },
    messages: {
      forbiddenRoundedClass: '<Textarea> に対する「{{ token }}」は直角規約（border-radius: 0）により禁止されています。',
      invalidSize: '<Textarea> の size「{{ size }}」は無効です。使用可能なサイズは sm / md / lg のみです。',
      forbiddenTextSizeClass: '<Textarea> に対するフォントサイズクラス「{{ token }}」は禁止されています。フォントサイズは size="sm | md | lg" prop によって自動同期されます。',
      forbiddenPaddingClass: '<Textarea> に対するパディングクラス「{{ token }}」は禁止されています。余白は size="sm | md | lg" prop によって自動同期されます。',
      noAccessibility: '<Textarea> への純粋な支援アクセシビリティ属性（{{ attr }}）の付与はプロジェクト規約により禁止されています。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename()

    // Textarea.vue 自体はスキップ
    if (filename.endsWith('Textarea.vue')) {
      return {}
    }

    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    return parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        const isTextarea = node.rawName === 'Textarea' || node.name === 'Textarea' || node.name === 'common-atoms-textarea'

        if (!isTextarea) return

        const attributes = node.startTag?.attributes || []

        for (const attr of attributes) {
          const isDirective = Boolean(attr.directive)
          const propName = isDirective ? attr.key?.argument?.name : attr.key?.name
          const rawVal = attr.value?.value

          // 1. サイズの検査
          if (propName === 'size' && !isDirective && typeof rawVal === 'string') {
            const sizeVal = rawVal.trim()

            if (!VALID_SIZES.has(sizeVal)) {
              context.report({
                node: attr,
                messageId: 'invalidSize',
                data: { size: sizeVal },
              })
            }
          }

          // 2. クラス属性の検査 (角丸・フォントサイズ・パディングの上書き禁止)
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
              else if (TEXT_SIZE_PATTERN.test(token)) {
                context.report({
                  node: attr,
                  messageId: 'forbiddenTextSizeClass',
                  data: { token },
                })
              }
              else if (PADDING_PATTERN.test(token)) {
                context.report({
                  node: attr,
                  messageId: 'forbiddenPaddingClass',
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
