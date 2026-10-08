import { expect, test } from '@playwright/test'

import { loginAsAdmin } from './helpers/auth'

test.describe('Standard Database Code-Splitting & Search Workflow', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAsAdmin(context, page)
  })

  test('should load cable database on-demand and filter by query', async ({ page }) => {
    await page.goto('/database/cable-db')
    await expect(page).toHaveTitle(/ケーブル規格/)
    await expect(page.locator('text=ケーブル規格').first()).toBeVisible()

    // 検索入力欄に CVT 22 を入力
    const searchInput = page.locator('input[placeholder*="CVT 22"]')

    await expect(searchInput).toBeVisible()
    await searchInput.fill('CVT 22')

    // 絞り込み後の行に CVT 22 が表示されていることを確認
    await expect(page.locator('table').locator('text=CVT 22').first()).toBeVisible()
  })

  test('should load conduit database independently with category filters', async ({ page }) => {
    await page.goto('/database/conduit-db')
    await expect(page).toHaveTitle(/配管規格/)
    await expect(page.locator('text=配管規格').first()).toBeVisible()
    await expect(page.locator('text=配管種類').first()).toBeVisible()
    await expect(page.locator('text=呼び径').first()).toBeVisible()
  })
})
