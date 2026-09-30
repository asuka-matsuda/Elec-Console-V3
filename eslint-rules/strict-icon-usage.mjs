/**
 * strict-icon-usage
 * [ESLint Custom Rule]
 *
 * 1. 未定義アイコンの検知 (unknownIcon):
 *    <Icon name="..." /> または :name="'...'" や三項演算子、
 *    および <Button icon="..." />, <SectionHeader icon="..." />, <EmptyState icon="..." /> 等の
 *    静的リテラルで渡されたアイコン名が ~/constants/icons.ts の ICONS 定義に存在しない場合にエラー。
 *
 * 2. 廃止・不要プロパティの検知 (deprecatedProp, invalidSize):
 *    <Icon> に対する strokeWidth / stroke-width の指定を禁止。
 *    <Icon> に対する size="xl" / size="xxl" の指定を禁止（有効値: sm, md, lg）。
 *
 * 3. 冗長・不適切なクラスの検知 (redundantClass, forbiddenClass):
 *    <Icon> に対する `shrink-0`, `inline-block`, `align-middle` は内部で指定済みなため冗長として禁止。
 *    <Icon> に対する `animate-spin` は禁止（spin プロパティを使用すること）。
 *    <Icon> に対する `w-*`, `h-*` 等の固定サイズクラスは禁止（size プロパティを使用すること）。
 */

import fs from 'fs'
import path from 'path'

let cachedIcons = null

function getAvailableIcons() {
  if (cachedIcons) return cachedIcons

  try {
    const filePath = path.resolve(process.cwd(), 'app/constants/icons.ts')
    const content = fs.readFileSync(filePath, 'utf8')
    const match = content.match(/export const ICONS[^{]+{([^}]+)}/s)

    if (match) {
      const keys = match[1]
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.includes(':'))
        .map(l => l.split(':')[0].trim().replace(/['"]/g, ''))

      cachedIcons = new Set(keys)
    }
    else {
      cachedIcons = new Set()
    }
  }
  catch {
    cachedIcons = new Set()
  }

  return cachedIcons
}

function extractStringLiterals(expression) {
  if (!expression) return []
  if (expression.type === 'Literal' && typeof expression.value === 'string') {
    return [{ value: expression.value, node: expression }]
  }
  if (expression.type === 'ConditionalExpression') {
    return [
      ...extractStringLiterals(expression.consequent),
      ...extractStringLiterals(expression.alternate),
    ]
  }
  if (expression.type === 'LogicalExpression') {
    return [
      ...extractStringLiterals(expression.left),
      ...extractStringLiterals(expression.right),
    ]
  }

  return []
}

function extractClassTokens(rawStr) {
  const tokens = []
  const regex = /(!?[\w\-:]+(\[.+?\])?)/g
  let m

  while ((m = regex.exec(rawStr)) !== null) {
    const token = m[1]

    if (['true', 'false', 'null', 'undefined', 'return'].includes(token)) continue
    tokens.push(token)
  }

  return tokens
}

const REDUNDANT_ICON_CLASSES = new Set([
  'shrink-0',
  'inline-block',
  'align-middle',
])

const VALID_SIZES = new Set(['sm', 'md', 'lg'])

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce strict and proper usage of <Icon> and icon names',
    },
    messages: {
      unknownIcon: 'アイコン「{{ name }}」は ~/constants/icons.ts に定義されていません。正しいアイコン名を指定するか、icons.ts に追加してください。',
      deprecatedProp: '<Icon> の「{{ name }}」プロパティは廃止されました。削除してください。',
      invalidSize: '<Icon> のサイズ「{{ size }}」は無効です。使用可能なサイズは sm / md / lg のみです。',
      redundantClass: '<Icon> に対する「{{ token }}」はコンポーネント内部で初期指定されているため冗長です。削除してください。',
      forbiddenAnimateSpin: '<Icon> に対する「animate-spin」は規約により禁止されています。:spin プロパティを使用してください。',
      forbiddenSizeClass: '<Icon> に対する固定サイズクラス「{{ token }}」は禁止されています。size プロパティ（sm / md / lg）を使用してください。',
    },
    schema: [],
  },
  create(context) {
    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    const availableIcons = getAvailableIcons()

    function checkIconName(name, node) {
      if (!name || typeof name !== 'string') return
      // 空文字やプレースホルダーはスキップ
      if (name.trim() === '') return

      if (availableIcons.size > 0 && !availableIcons.has(name)) {
        context.report({
          node,
          messageId: 'unknownIcon',
          data: { name },
        })
      }
    }

    return parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        const isIconComponent = node.rawName === 'Icon' || node.name === 'Icon' || node.name === 'icon'
        const attributes = node.startTag?.attributes || []

        for (const attr of attributes) {
          const isDirective = Boolean(attr.directive)
          const propName = isDirective ? attr.key?.argument?.name : attr.key?.name

          // 1. アイコン名の検査 (<Icon name="..."> または各コンポーネントの icon="...")
          const shouldCheckIconName = (isIconComponent && propName === 'name') || (!isIconComponent && propName === 'icon')

          if (shouldCheckIconName) {
            if (!isDirective && attr.value?.value) {
              checkIconName(attr.value.value, attr)
            }
            else if (isDirective && attr.value?.expression) {
              const literals = extractStringLiterals(attr.value.expression)

              for (const { value, node: litNode } of literals) {
                checkIconName(value, litNode)
              }
            }
          }

          // 以下、<Icon> 専用のチェック
          if (!isIconComponent) continue

          // 2. 廃止プロパティの検査 (strokeWidth, stroke-width)
          if (propName === 'strokeWidth' || propName === 'stroke-width') {
            context.report({
              node: attr,
              messageId: 'deprecatedProp',
              data: { name: propName },
            })
          }

          // 3. サイズの検査 (size="xl", size="xxl" 等)
          if (propName === 'size') {
            let sizeVal = null

            if (!isDirective && attr.value?.value) {
              sizeVal = attr.value.value
            }
            else if (isDirective && attr.value?.expression) {
              const literals = extractStringLiterals(attr.value.expression)

              if (literals.length > 0) sizeVal = literals[0].value
            }

            if (sizeVal && !VALID_SIZES.has(sizeVal)) {
              context.report({
                node: attr,
                messageId: 'invalidSize',
                data: { size: sizeVal },
              })
            }
          }

          // 4. クラス指定の検査 (class="...", :class="...")
          if (propName === 'class') {
            const classStrings = []

            if (!isDirective && attr.value?.value) {
              classStrings.push({ text: attr.value.value, node: attr })
            }
            else if (isDirective && attr.value?.expression) {
              const exp = attr.value.expression

              if (exp.type === 'Literal' && typeof exp.value === 'string') {
                classStrings.push({ text: exp.value, node: exp })
              }
              else if (exp.type === 'ArrayExpression') {
                for (const el of exp.elements) {
                  if (el?.type === 'Literal' && typeof el.value === 'string') {
                    classStrings.push({ text: el.value, node: el })
                  }
                }
              }
              else if (exp.type === 'ObjectExpression') {
                for (const prop of exp.properties) {
                  if (prop.type === 'Property') {
                    const keyName = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value

                    if (typeof keyName === 'string') {
                      classStrings.push({ text: keyName, node: prop.key })
                    }
                  }
                }
              }
            }

            for (const { text, node: targetNode } of classStrings) {
              const tokens = extractClassTokens(text)

              for (const token of tokens) {
                if (REDUNDANT_ICON_CLASSES.has(token)) {
                  context.report({
                    node: targetNode,
                    messageId: 'redundantClass',
                    data: { token },
                  })
                }
                if (token === 'animate-spin') {
                  context.report({
                    node: targetNode,
                    messageId: 'forbiddenAnimateSpin',
                  })
                }
                if (/^[wh]-(4|5|6|8|10|12|\d+)$/.test(token)) {
                  context.report({
                    node: targetNode,
                    messageId: 'forbiddenSizeClass',
                    data: { token },
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
