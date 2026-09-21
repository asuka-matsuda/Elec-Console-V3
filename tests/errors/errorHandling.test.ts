import { describe, expect, it } from 'vitest'

import { AppException, parseToAppException } from '../../app/utils/errors'
import { createAppError, generateTraceId, getDefaultStatusCode } from '../../server/utils/error'
import {
  DEFAULT_ERROR_MESSAGES,
  ERROR_SHORT_CODES,
  ErrorCode,
} from '../../shared/types/errors'

describe('ErrorCode and Definitions', () => {
  it('should have matching short codes and default messages for all error codes', () => {
    const codes = Object.values(ErrorCode)

    expect(codes.length).toBeGreaterThan(10)

    for (const code of codes) {
      expect(ERROR_SHORT_CODES[code]).toBeDefined()
      expect(ERROR_SHORT_CODES[code]).toMatch(/^E-[A-Z]{2,3}-\d{3}$/)
      expect(DEFAULT_ERROR_MESSAGES[code]).toBeDefined()
      expect(typeof DEFAULT_ERROR_MESSAGES[code]).toBe('string')
    }
  })
})

describe('Server Error Utilities (createAppError & generateTraceId)', () => {
  it('should generate trace ID with expected format ERR-YYYYMMDD-XXXX', () => {
    const traceId = generateTraceId()

    expect(traceId).toMatch(/^ERR-\d{8}-[0-9A-F]{4}$/)
  })

  it('should return correct default status codes', () => {
    expect(getDefaultStatusCode(ErrorCode.AUTH_UNAUTHORIZED)).toBe(401)
    expect(getDefaultStatusCode(ErrorCode.AUTH_INVALID_CREDENTIALS)).toBe(401)
    expect(getDefaultStatusCode(ErrorCode.USER_MASTER_PROTECTED)).toBe(403)
    expect(getDefaultStatusCode(ErrorCode.USER_NOT_FOUND)).toBe(404)
    expect(getDefaultStatusCode(ErrorCode.USER_LOGIN_ID_DUPLICATE)).toBe(409)
    expect(getDefaultStatusCode(ErrorCode.CIRCUIT_VERSION_CONFLICT)).toBe(409)
    expect(getDefaultStatusCode(ErrorCode.SYS_RATE_LIMITED)).toBe(429)
    expect(getDefaultStatusCode(ErrorCode.SYS_INTERNAL_ERROR)).toBe(500)
    expect(getDefaultStatusCode(ErrorCode.SYS_UNKNOWN_ERROR)).toBe(500)
    expect(getDefaultStatusCode(ErrorCode.SYS_VALIDATION_FAILED)).toBe(400)
  })

  it('should construct H3 error with structured payload via createAppError', () => {
    const h3Error = createAppError({
      code: ErrorCode.USER_LOGIN_ID_DUPLICATE,
      message: 'カスタム重複メッセージ',
      details: { field: 'loginId', value: 'admin' },
    })

    expect(h3Error.statusCode).toBe(409)
    expect(h3Error.statusMessage).toBe(ErrorCode.USER_LOGIN_ID_DUPLICATE)
    expect(h3Error.message).toBe('カスタム重複メッセージ')
    expect(h3Error.data).toEqual({
      code: ErrorCode.USER_LOGIN_ID_DUPLICATE,
      shortCode: 'E-USR-002',
      message: 'カスタム重複メッセージ',
      details: { field: 'loginId', value: 'admin' },
      traceId: undefined,
      field: 'loginId',
      value: 'admin',
    })
  })
})

describe('Client Error Handling (AppException & parseToAppException)', () => {
  it('should correctly format user facing message with short code and trace ID', () => {
    const exWithoutTrace = new AppException({
      code: ErrorCode.USER_LOGIN_ID_DUPLICATE,
      message: 'このIDは既に使用されています',
    })

    expect(exWithoutTrace.getUserFacingMessage()).toBe('[E-USR-002] このIDは既に使用されています')

    const exWithTrace = new AppException({
      code: ErrorCode.SYS_UNKNOWN_ERROR,
      message: 'システムエラーが発生しました',
      traceId: 'ERR-20260920-ABCD',
    })

    expect(exWithTrace.getUserFacingMessage()).toBe(
      '[E-SYS-999] システムエラーが発生しました (問合せ番号: ERR-20260920-ABCD)',
    )
  })

  it('should parse structured server error payload into AppException', () => {
    const serverError = {
      statusCode: 409,
      data: {
        code: ErrorCode.CIRCUIT_VERSION_CONFLICT,
        shortCode: 'E-CIR-002',
        message: '別作業者による更新競合',
        details: { currentCircuit: { id: 'c-1', version: 2 } },
        traceId: 'ERR-20260920-1111',
      },
    }

    const appEx = parseToAppException(serverError)

    expect(appEx).toBeInstanceOf(AppException)
    expect(appEx.code).toBe(ErrorCode.CIRCUIT_VERSION_CONFLICT)
    expect(appEx.shortCode).toBe('E-CIR-002')
    expect(appEx.statusCode).toBe(409)
    expect(appEx.isConflict()).toBe(true)
    expect(appEx.details).toEqual({ currentCircuit: { id: 'c-1', version: 2 } })
    expect(appEx.traceId).toBe('ERR-20260920-1111')
  })

  it('should handle network connection failure as SYS_NETWORK_ERROR', () => {
    const networkErr = new TypeError('Failed to fetch')
    const appEx = parseToAppException(networkErr)

    expect(appEx).toBeInstanceOf(AppException)
    expect(appEx.code).toBe(ErrorCode.SYS_NETWORK_ERROR)
    expect(appEx.shortCode).toBe('E-SYS-002')
  })

  it('should handle server gateway 502/503 as SYS_SERVER_UNAVAILABLE', () => {
    const gatewayErr = { statusCode: 503, message: 'Service Unavailable' }
    const appEx = parseToAppException(gatewayErr)

    expect(appEx).toBeInstanceOf(AppException)
    expect(appEx.code).toBe(ErrorCode.SYS_SERVER_UNAVAILABLE)
    expect(appEx.shortCode).toBe('E-SYS-003')
  })

  it('should fallback unknown generic errors to SYS_UNKNOWN_ERROR', () => {
    const unknownErr = new Error('Something completely unexpected happened')
    const appEx = parseToAppException(unknownErr)

    expect(appEx).toBeInstanceOf(AppException)
    expect(appEx.code).toBe(ErrorCode.SYS_UNKNOWN_ERROR)
    expect(appEx.shortCode).toBe('E-SYS-999')
    expect(appEx.message).toBe('Something completely unexpected happened')
  })
})
