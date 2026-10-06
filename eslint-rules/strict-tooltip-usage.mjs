/**
 * strict-tooltip-usage
 * [ESLint Custom Rule]
 * Vercel Geist Tooltip ベストプラクティスに準拠した厳格な使用監視ルール
 * （※支援アクセシビリティ関連属性はプロジェクト規約により除外）
 *
 * 監視項目:
 * 1. 直角規約違反（rounded-* クラスの付与禁止）
 * 2. 配置指定の検証（top / bottom / left / right / *-start / *-end のみ許可）
 * 3. カラータイプの検証（default / invert / secondary / warning / error / success のみ許可）
 * 4. 支援アクセシビリティ属性の禁止（aria-*, role 等の付与禁止。プロジェクト規約準拠）
 * 5. ラベル付き入力要素の直接ラッピング禁止（Geist 規約: Input や label を Tooltip で囲まない）
 * 6. コンテンツ指定の検証（text, content, または #content スロットの指定を必須化）
 */

const VALID_PLACEMENTS = new Set([
  'top',
  'bottom',
  'left',
  'right',
  'top-start',
  'top-end',
  'bottom-start',
  'bottom-end',
  'left-start',
  'left-end',
  'right-start',
  'right-end',
])

const VALID_TYPES = new Set(['default', 'invert', 'secondary', 'warning', 'error', 'success'])

const FORBIDDEN_WRAPPED_ELEMENTS = new Set([
  'Input',
  'Textarea',
  'Select',
  'Combobox',
  'label',
  'common-atoms-input',
  'common-atoms-textarea',
  'common-atoms-select',
])

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist Tooltip best practices strictly',
    },
    messages: {
      forbiddenRoundedClass: '<Tooltip> に対する「{{ token }}」は直角規約（border-radius: 0）により禁止されています。',
      invalidPlacement: '<Tooltip> の placement「{{ placement }}」は無効です。使用可能な配置は top / bottom / left / right（および -start / -end 接尾辞）のみです。',
      invalidType: '<Tooltip> の type「{{ type }}」は無効です。使用可能なタイプは default / invert / secondary / warning / error / success のみです。',
      noAccessibility: '<Tooltip> への純粋な支援アクセシビリティ属性（{{ attr }}）の付与はプロジェクト規約により禁止されています。',
      forbiddenWrappedInput: 'ラベル付き入力要素（<{{ element }}>）を <Tooltip> で直接ラップすることは Geist ベストプラクティスにより禁止されています。ヘルプは隣接するアイコンボタン等に配置してください。',
      missingContent: '<Tooltip> には text または content prop、あるいは #content スロットで説明文を指定してください。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename()

    // Tooltip.vue 自体はスキップ
    if (filename.endsWith('Tooltip.vue')) {
      return {}
    }

    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    return parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        const isTooltip = node.rawName === 'Tooltip' || node.name === 'Tooltip' || node.name === 'common-atoms-tooltip'

        if (!isTooltip) return

        const attributes = node.startTag?.attributes || []
        let hasTextOrContent = false

        for (const attr of attributes) {
          const isDirective = Boolean(attr.directive)
          const propName = isDirective ? attr.key?.argument?.name : attr.key?.name
          const rawVal = attr.value?.value

          if (propName === 'text' || propName === 'content') {
            hasTextOrContent = true
          }

          // 1. クラス属性の検査 (角丸の禁止)
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

          // 2. placement の検査
          if (propName === 'placement' && !isDirective && typeof rawVal === 'string') {
            const placementVal = rawVal.trim()

            if (!VALID_PLACEMENTS.has(placementVal)) {
              context.report({
                node: attr,
                messageId: 'invalidPlacement',
                data: { placement: placementVal },
              })
            }
          }

          // 3. type の検査
          if (propName === 'type' && !isDirective && typeof rawVal === 'string') {
            const typeVal = rawVal.trim()

            if (!VALID_TYPES.has(typeVal)) {
              context.report({
                node: attr,
                messageId: 'invalidType',
                data: { type: typeVal },
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

        // 5. 子要素の検査（Input/Textarea/Select/label を直接ラップしていないか、および #content スロットがあるか）
        let hasContentSlot = false
        const children = node.children || []

        for (const child of children) {
          if (child.type === 'VElement') {
            const childName = child.rawName || child.name

            if (FORBIDDEN_WRAPPED_ELEMENTS.has(childName)) {
              context.report({
                node: child,
                messageId: 'forbiddenWrappedInput',
                data: { element: childName },
              })
            }

            // template #content スロットの検知
            if (childName === 'template') {
              const childAttrs = child.startTag?.attributes || []

              for (const childAttr of childAttrs) {
                if (childAttr.directive && (childAttr.key?.name?.name === 'slot' || childAttr.key?.name === 'slot')) {
                  const slotName = childAttr.key?.argument?.name

                  if (slotName === 'content') {
                    hasContentSlot = true
                  }
                }
              }
            }
          }
        }

        // 6. コンテンツ指定の検証
        if (!hasTextOrContent && !hasContentSlot) {
          context.report({
            node,
            messageId: 'missingContent',
          })
        }
      },
    })
  },
}
