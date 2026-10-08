import type { H3Event } from 'h3'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { validateRequestBody } from '../../server/utils/validation'
import { ErrorCode } from '../../shared/types/errors'

describe('Server Request Validation Utility (validateRequestBody)', () => {
  const dummySchema = z.object({
    name: z.string().min(1, '名称を入力してください。'),
    count: z.number().int().positive('1以上の整数を指定してください。'),
  })

  const ParsedBodySymbol = Symbol.for('h3ParsedBody')

  it('should parse and infer valid request body successfully', async () => {
    const mockEvent = {
      method: 'POST',
      node: {
        req: {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          [ParsedBodySymbol]: { name: 'テスト現場', count: 10 },
        },
      },
    } as unknown as H3Event

    const validated = await validateRequestBody(mockEvent, dummySchema)

    expect(validated).toEqual({ name: 'テスト現場', count: 10 })
  })

  it('should throw createAppError with SYS_VALIDATION_FAILED when payload is invalid', async () => {
    const mockEvent = {
      method: 'POST',
      node: {
        req: {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          [ParsedBodySymbol]: { name: '', count: -1 },
        },
      },
    } as unknown as H3Event

    await expect(validateRequestBody(mockEvent, dummySchema)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: ErrorCode.SYS_VALIDATION_FAILED,
    })
  })
})
