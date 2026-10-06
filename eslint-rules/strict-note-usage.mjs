/**
 * strict-note-usage
 * [ESLint Custom Rule]
 * Vercel Geist Note ベストプラクティスに準拠した厳格な使用監視ルール
 * （※支援アクセシビリティ関連属性はプロジェクト規約により除外）
 *
 * 監視項目:
 * 1. 旧コンポーネント名 <Alert> の使用禁止（<Note> への統一）
 * 2. 直角規約違反（<Note> に対する rounded-* クラスの付与禁止）
 * 3. 支援アクセシビリティ属性の禁止（aria-*, role 等の付与禁止。プロジェクト規約準拠）
 * 4. バリアントの検証（secondary / warning / error / success / danger / info / default のみ許可）
 */

const VALID_VARIANTS = new Set([
  'secondary',
  'warning',
  'error',
  'success',
  'danger',
  'info',
  'default',
])

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist Note best practices strictly',
    },
    messages: {
      deprecatedComponent: '「<Alert>」は非推奨です。Vercel Geist 準拠の「<Note>」を使用してください。',
      forbiddenRoundedClass: '<Note> に対する「{{ token }}」は直角規約（border-radius: 0）により禁止されています。',
      invalidVariant: '<Note> の variant「{{ variant }}」は無効です。使用可能なバリアントは secondary / warning / error / success のみです。',
      noAccessibility: '<Note> への純粋な支援アクセシビリティ属性（{{ attr }}）の付与はプロジェクト規約により禁止されています。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename()

    // Note.vue 自体は内部実装のため除外
    if (filename.endsWith('Note.vue')) {
      return {}
    }

    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    return parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        // 1. 旧 Alert の検知
        if (node.rawName === 'Alert' || node.name === 'Alert' || node.name === 'common-molecules-alert') {
          context.report({
            node,
            messageId: 'deprecatedComponent',
          })

          return
        }

        const isNote = node.rawName === 'Note' || node.name === 'Note' || node.name === 'common-molecules-note'

        if (!isNote) return

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

          // 3. variant の検査
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
