/**
 * no-slot-forwarding
 * [ESLint Custom Rule]
 * 子コンポーネントのスロットコンテンツとして <slot> を配置し、
 * 親から孫へスロットを丸投げ中継する「スロットのバケツリレー（Slot Tunneling / Forwarding）」を禁止するルール。
 *
 * 理由: 中間ラッパーコンポーネントがスロットを横流しするだけの構造は、
 * テンプレートのネストを無駄に深くし、Scoped CSS の境界を破壊して :deep() 打消しを誘発します。
 * 中間ラッパーを廃止し、利用側で直接基盤コンポーネント（Table, Modal 等）を合成してください。
 */

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow slot forwarding where a component passes slots down to a child component',
    },
    messages: {
      noSlotForwarding: '子コンポーネント（<{{ componentName }}>）のスロット内で <slot> を中継（スロットのバケツリレー）することは禁止されています。中間ラッパーを廃止して直接基盤コンポーネントを利用するか、コンポーネント合成に設計を見直してください。',
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
        // 対象は <slot> タグ
        if (node.rawName !== 'slot' && node.name !== 'slot') {
          return
        }

        // 祖先を遡り、名前付きスロットテンプレート（<template #xxx>）またはカスタムコンポーネントの内側にいるかをチェック
        let curr = node.parent
        let insideForwardingSlot = false
        let hostComponentName = ''

        while (curr) {
          if (curr.type === 'VElement') {
            const tagName = curr.rawName || curr.name

            // パターン1: <template #cell-xxx> のような名前付きスロットの中で <slot> を使っている
            if (tagName === 'template') {
              const hasSlotDirective = curr.startTag?.attributes?.some(
                attr => attr.directive && (attr.key.name?.name === 'slot' || attr.key.name?.name === '#'),
              )

              if (hasSlotDirective) {
                insideForwardingSlot = true
                // さらに親のコンポーネント名を探す
                let p = curr.parent

                while (p) {
                  if (p.type === 'VElement' && /^[A-Z]/.test(p.rawName || p.name)) {
                    hostComponentName = p.rawName || p.name
                    break
                  }
                  p = p.parent
                }
                break
              }
            }

            // パターン2: Table 等の複合コンポーネント直下でスロットを流している
            if (['Table', 'Tabs'].includes(tagName)) {
              insideForwardingSlot = true
              hostComponentName = tagName
              break
            }
          }
          curr = curr.parent
        }

        if (insideForwardingSlot) {
          context.report({
            node,
            messageId: 'noSlotForwarding',
            data: {
              componentName: hostComponentName || 'Component',
            },
          })
        }
      },
    })
  },
}
