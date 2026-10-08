import { expect, test } from '@playwright/test'

import { loginAsAdmin } from './helpers/auth'

test.describe('Reports & Print Workflow', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAsAdmin(context, page)
  })

  test('should render reports page and switch between report tabs', async ({ page }) => {
    await page.goto('/portal/test/reports')
    await expect(page).toHaveTitle(/帳票/)

    // 1. デフォルトタブ（線名札・ラベル）の描画確認
    await expect(page.locator('text=線名札・ラベル').first()).toBeVisible()
    await expect(page.locator('text=使用ひな形:').first()).toBeVisible()
    await expect(page.locator('text=系統:').first()).toBeVisible()

    // 2. 送電試験結果タブへ切り替え
    const examTab = page.locator('text=送電試験結果').first()

    await examTab.click()
    await expect(page).toHaveURL(/tab=exam/)
    await expect(page.locator('text=出力対象サマリー').first()).toBeVisible()
    await expect(page.locator('text=出力対象の盤').first()).toBeVisible()

    // 3. リモコン設定表タブへ切り替え
    const remoteTab = page.locator('text=リモコン設定表').first()

    await remoteTab.click()
    await expect(page).toHaveURL(/tab=remote/)
    await expect(page.locator('text=リモコン編成サマリー').first()).toBeVisible()
    await expect(page.locator('text=伝送系統').first()).toBeVisible()
  })
})
