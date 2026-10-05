/**
 * strict-button-usage
 * [ESLint Custom Rule]
 * Vercel Geist Button ベストプラクティスに準拠した厳格な使用監視ルール
 *
 * 監視項目:
 * 1. バリアントの検証（primary / secondary / tertiary / danger / warning）
 * 2. サイズの検証（sm / md / lg）
 * 3. 外部からのフォントサイズ上書き禁止（text-* の付与禁止）
 * 4. 外部からの余白上書き禁止（p-*, px-*, py-* 等の付与禁止）
 * 5. 外部からの高さ上書き禁止（h-* 等の付与禁止）
 * 6. 直角規約違反（rounded-* クラスの付与禁止）
 */

const VALID_VARIANTS = new Set([
  'primary',
  'secondary',
  'tertiary',
  'danger',
  'warning',
])

const VALID_SIZES = new Set(['sm', 'md', 'lg'])

// フォントサイズを変更する Tailwind トークンパターン (text-xs, text-sm, text-base, text-lg, text-xl, text-[20px] 等)
// ※ text-left, text-center, text-right, text-white, text-danger などの配置・色は別ルールで検知、ここではサイズのみ
const TEXT_SIZE_PATTERN = /^text-(xs|sm|base|lg|xl|[2-9]xl|\[\d+px\])$/

// パディングを変更する Tailwind トークンパターン
const PADDING_PATTERN = /^p[xytrbl]?-/

// 高さを変更する Tailwind トークンパターン
const HEIGHT_PATTERN = /^h-(auto|full|screen|\d+|\[.+\])$/

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist Button best practices strictly',
    },
    messages: {
      invalidVariant: '<Button> の variant「{{ variant }}」は無効です。使用可能なバリアントは primary / secondary / tertiary / danger / warning です。',
      invalidSize: '<Button> の size「{{ size }}」は無効です。使用可能なサイズは sm / md / lg のみです。',
      forbiddenTextSizeClass: '<Button> に対するフォントサイズクラス「{{ token }}」は禁止されています。フォントサイズは size="sm | md | lg" prop によって自動同期されます。',
      forbiddenPaddingClass: '<Button> に対するパディングクラス「{{ token }}」は禁止されています。余白は size="sm | md | lg" prop によって自動同期されます。',
      forbiddenHeightClass: '<Button> に対する高さクラス「{{ token }}」は禁止されています。高さは size="sm | md | lg" prop によって自動同期されます。',
      forbiddenRoundedClass: '<Button> に対する角丸クラス「{{ token }}」は直角規約（border-radius: 0）により禁止されています。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename()

    // Button.vue 自体はスキップ
    if (filename.endsWith('Button.vue')) {
      return {}
    }

    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    return parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        const isButton = node.rawName === 'Button' || node.name === 'Button' || node.name === 'common-atoms-button'

        if (!isButton) return

        const attributes = node.startTag?.attributes || []

        for (const attr of attributes) {
          const isDirective = Boolean(attr.directive)
          const propName = isDirective ? attr.key?.argument?.name : attr.key?.name
          const rawVal = attr.value?.value

          // 1. バリアントの検査
          if (propName === 'variant' && !isDirective && typeof rawVal === 'string') {
            const variantVal = rawVal.trim()

            if (!VALID_VARIANTS.has(variantVal)) {
              context.report({
                node: attr,
                messageId: 'invalidVariant',
                data: { variant: variantVal },
              })
            }
          }

          // 2. サイズの検査
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

          // 3. クラス属性の検査 (フォントサイズ、パディング、高さ、角丸の上書き禁止)
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
              else if (HEIGHT_PATTERN.test(token)) {
                context.report({
                  node: attr,
                  messageId: 'forbiddenHeightClass',
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
