/**
 * strict-skeleton-usage
 * [ESLint Custom Rule]
 * Vercel Geist Skeleton ベストプラクティスに準拠した厳格な使用監視ルール
 * （※支援アクセシビリティ関連属性はプロジェクト規約により除外）
 *
 * 監視項目:
 * 1. 直角規約違反（rounded-* クラスの付与禁止。真円は circle / pill prop を使用）
 * 2. インタラクティブ化の禁止（@click, @keydown 等のイベントハンドラ付与禁止。Skeletonは純粋な装飾プレースホルダー）
 * 3. 支援アクセシビリティ属性の禁止（aria-*, role 等の付与禁止。プロジェクト規約準拠）
 * 4. 子要素ラッピング時の動的フラグ（:show prop）の指定強制（常設プレースホルダー誤用の防止）
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist Skeleton best practices strictly',
    },
    messages: {
      forbiddenRoundedClass: '<Skeleton> に対する「{{ token }}」は直角規約（border-radius: 0）により禁止されています。円形要素には circle または pill prop を使用してください。',
      noInteractive: '<Skeleton> は純粋な装飾プレースホルダーです。イベント「{{ event }}」の付与は禁止されています。',
      noAccessibility: '<Skeleton> への純粋な支援アクセシビリティ属性（{{ attr }}）の付与はプロジェクト規約により禁止されています。',
      wrappingRequiresShow: '<Skeleton> で子要素をラップする場合は、ロード状態を制御する「:show」属性を指定してください。常設装飾としての配置は禁止されています。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename()

    // Skeleton.vue 自体はスキップ
    if (filename.endsWith('Skeleton.vue')) {
      return {}
    }

    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    return parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        const isSkeleton = node.rawName === 'Skeleton' || node.name === 'Skeleton' || node.name === 'common-atoms-skeleton'

        if (!isSkeleton) return

        const attributes = node.startTag?.attributes || []
        let hasShowProp = false

        for (const attr of attributes) {
          const isDirective = Boolean(attr.directive)
          const propName = isDirective ? attr.key?.argument?.name : attr.key?.name
          const rawVal = attr.value?.value

          // 1. 直角規約違反（rounded-* クラス）
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

          // 2. インタラクティブ化の禁止（@click, @keydown 等のイベントディレクティブ）
          if (isDirective && attr.key?.name?.name === 'on') {
            const eventName = attr.key?.argument?.name || 'event'

            context.report({
              node: attr,
              messageId: 'noInteractive',
              data: { event: `@${eventName}` },
            })
          }

          // 3. 支援アクセシビリティ属性の禁止
          if (propName && (propName.startsWith('aria-') || propName === 'role')) {
            context.report({
              node: attr,
              messageId: 'noAccessibility',
              data: { attr: propName },
            })
          }

          if (propName === 'show') {
            hasShowProp = true
          }
        }

        // 4. 子要素があるのに show prop が指定されていない（常設プレースホルダー誤用）の検知
        const hasChildren = node.children && node.children.some((c) => {
          if (c.type === 'VText') return c.value.trim().length > 0
          if (c.type === 'VElement') return true

          return false
        })

        if (hasChildren && !hasShowProp) {
          context.report({
            node,
            messageId: 'wrappingRequiresShow',
          })
        }
      },
    })
  },
}
