import type { BrowserContext, Page } from '@playwright/test'

import { generateAuthToken } from '../../server/utils/auth'

/**
 * テスト実行用に管理者セッショントークンを Cookie に設定し、
 * ログイン済み状態でテストを開始できるようにするヘルパー
 */
export async function loginAsAdmin(context: BrowserContext, _page?: Page): Promise<string> {
  const token = generateAuthToken({
    id: 'master',
    loginId: 'master',
    role: 'admin',
  })

  await context.addCookies([
    {
      name: 'auth_token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ])

  return token
}
