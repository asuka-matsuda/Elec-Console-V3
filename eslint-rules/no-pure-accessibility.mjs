/**
 * no-pure-accessibility
 * [ESLint Custom Rule]
 * ユーザーの効率に直結しない純粋な支援アクセシビリティ（aria-* 属性、role 属性）
 * の使用を禁止するルール。
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow pure accessibility attributes (aria-* and role) in templates',
    },
    messages: {
      forbidden: '純粋な支援アクセシビリティ属性「{{ name }}」は規約により禁止されています。ユーザーの操作効率に直結する機能（キーボード操作・ショートカット等）以外の不要な属性は記述しないでください。',
    },
    schema: [],
  },
  create(context) {
    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    function checkAttributeName(name, node) {
      if (!name) return

      if (name.startsWith('aria-') || name === 'role') {
        context.report({
          node,
          messageId: 'forbidden',
          data: { name },
        })
      }
    }

    return parserServices.defineTemplateBodyVisitor({
      VAttribute(node) {
        if (!node.directive) {
          checkAttributeName(node.key.name, node)
        }
        else if (node.directive && node.key.name?.name === 'bind' && node.key.argument?.name) {
          checkAttributeName(node.key.argument.name, node)
        }
      },
    })
  },
}
