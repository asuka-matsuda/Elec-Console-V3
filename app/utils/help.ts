/**
 * ヘルプツールチップコンテンツ解決ユーティリティ
 *
 * ヘルプIDから対応する解説文・タイトル・参照規格を取得する関数を提供します。
 */

import {
  HELP_ITEMS,
  type HelpContent,
  type HelpId,
} from '~/constants/helpConstants'

/**
 * ヘルプIDからヘルプコンテンツを取得する関数
 *
 * @param id ヘルプID（例: 'voltageDrop', 'conduitFillRate' 等）
 * @returns ヘルプコンテンツオブジェクト、未定義時は undefined
 */
export function getHelpContent(id: HelpId): HelpContent | undefined {
  return HELP_ITEMS[id]
}
