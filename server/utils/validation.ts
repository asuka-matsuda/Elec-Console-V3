/**
 * サーバー側リクエストバリデーションユーティリティ
 *
 * Zod スキーマに基づき H3 リクエストボディのランタイム検証を行い、
 * 成功時は完全な型推論を提供し、失敗時は統一 AppException (400) を送出します。
 */

import type { H3Event } from 'h3'
import { readBody } from 'h3'
import type { z, ZodType } from 'zod'

import { ErrorCode } from '#shared/types/errors'

import { createAppError } from './error'

/**
 * H3 イベントからリクエストボディを読み込み、指定された Zod スキーマで検証します。
 * バリデーション失敗時は自動的に統一エラー（SYS_VALIDATION_FAILED: 400）をスローします。
 *
 * @param event H3Event
 * @param schema Zod スキーマ
 * @returns 検証済みかつ型推論されたリクエストデータ
 */
export async function validateRequestBody<T extends ZodType>(
  event: H3Event,
  schema: T,
): Promise<z.infer<T>> {
  const body = await readBody(event)
  const result = schema.safeParse(body)

  if (!result.success) {
    const firstIssue = result.error.issues[0]
    const message = firstIssue?.message || '入力データが不正です。'

    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message,
      details: {
        issues: result.error.issues,
      },
    })
  }

  return result.data
}
