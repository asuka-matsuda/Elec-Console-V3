/**
 * 計算ツールエラー情報解決ユーティリティ
 *
 * エラーIDから対応する計算エラー定義（タイトル・詳細メッセージ・改善提案）を取得する関数を提供します。
 */

import {
  TOOL_ERRORS,
  type ToolErrorId,
  type ToolErrorInfo,
} from '~/constants/toolErrorConstants'

/**
 * エラーIDからエラー情報を取得する関数
 *
 * @param id エラーID（例: 'RACK_TIER2_NOT_APPLICABLE' 等）
 * @returns エラー情報オブジェクト、未指定時または未定義時は undefined
 */
export function getToolError(id: ToolErrorId | undefined | null): ToolErrorInfo | undefined {
  if (!id) return undefined

  return TOOL_ERRORS[id]
}
