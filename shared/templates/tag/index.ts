import type { TagTemplateDefinition } from '#shared/types/tagTemplate'

import { kfc3350Template } from './kfc3350'

/**
 * 登録済み線名札・タグテンプレート定義一覧
 *
 * @description
 * 新しい用紙・テンプレートを追加する場合は、定義オブジェクトを作成し
 * この配列に追加してください。
 */
export const TAG_TEMPLATE_DEFINITIONS: TagTemplateDefinition[] = [
  kfc3350Template,
]

/**
 * テンプレート名またはファイル名から該当する確定定義を取得
 */
export function findTagTemplateDefinition(
  nameOrFilename?: string | null,
): TagTemplateDefinition | null {
  if (!nameOrFilename || typeof nameOrFilename !== 'string') {
    return null
  }

  const trimmed = nameOrFilename.trim()

  return (
    TAG_TEMPLATE_DEFINITIONS.find(def => def.match(trimmed) || def.id === trimmed)
    || null
  )
}

export * from './kfc3350'
