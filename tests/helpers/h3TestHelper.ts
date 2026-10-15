import type { H3Event } from 'h3'

import { generateAuthToken } from '../../server/utils/auth'

const ParsedBodySymbol = Symbol.for('h3ParsedBody')

export interface MockH3EventOptions {
  method?: string
  url?: string
  params?: Record<string, string>
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  headers?: Record<string, string>
  cookies?: Record<string, string>
  user?: {
    id: string
    loginId: string
    role: string
    password?: string
  }
  token?: string
  ip?: string
}

export function createTestH3Event(options: MockH3EventOptions = {}): H3Event {
  const method = options.method || (options.body !== undefined ? 'POST' : 'GET')
  const headers: Record<string, string> = {}

  if (options.headers) {
    for (const [k, v] of Object.entries(options.headers)) {
      headers[k.toLowerCase()] = v
    }
  }

  const token = options.token || (options.user ? generateAuthToken(options.user) : undefined)

  if (token && !headers.authorization) {
    headers.authorization = `Bearer ${token}`
  }

  const cookieEntries: string[] = []

  if (options.cookies) {
    for (const [k, v] of Object.entries(options.cookies)) {
      cookieEntries.push(`${k}=${encodeURIComponent(v)}`)
    }
  }
  if (token && !options.cookies?.auth_token) {
    cookieEntries.push(`auth_token=${encodeURIComponent(token)}`)
  }
  if (cookieEntries.length > 0 && !headers.cookie) {
    headers.cookie = cookieEntries.join('; ')
  }

  if (options.body !== undefined && !headers['content-type']) {
    headers['content-type'] = 'application/json'
  }

  let url = options.url || '/api/test'

  if (options.query) {
    const searchParams = new URLSearchParams()

    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined) {
        searchParams.set(k, String(v))
      }
    }
    const qs = searchParams.toString()

    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs
    }
  }

  const resHeaders = new Map<string, string | string[]>()

  const req: Record<string, unknown> = {
    method,
    url,
    headers,
    socket: {
      remoteAddress: options.ip || '127.0.0.1',
    },
  }

  if (options.body !== undefined) {
    req[ParsedBodySymbol] = options.body
  }

  const res = {
    statusCode: 200,
    getHeader: (name: string) => resHeaders.get(name.toLowerCase()),
    setHeader: (name: string, value: string | string[]) => {
      resHeaders.set(name.toLowerCase(), value)
    },
    getHeaders: () => Object.fromEntries(resHeaders.entries()),
  }

  return {
    method,
    path: url,
    headers: new Headers(headers),
    context: {
      params: options.params || {},
    },
    node: {
      req,
      res,
    },
  } as unknown as H3Event
}
