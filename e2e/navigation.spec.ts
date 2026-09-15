import { expect, test } from '@playwright/test'

import { loginAsAdmin } from './helpers/auth'

test.describe('Navigation & Page Smoke Tests', () => {
  test('should redirect unauthenticated users to /login', async ({ page }) => {
    await page.goto('/tools/conduit')
    await expect(page).toHaveURL(/\/login/)
    await expect(page).toHaveTitle(/ログイン/)
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test.describe('Authenticated Navigation', () => {
    test.beforeEach(async ({ context, page }) => {
      await loginAsAdmin(context, page)
    })

    test('should display Glossary page with correct title and search elements', async ({ page }) => {
      await page.goto('/reference/glossary')
      await expect(page).toHaveTitle(/用語集/)
      await expect(page.locator('input[placeholder*="検索"]')).toBeVisible()
    })

    test('should load Conduit Calculator page', async ({ page }) => {
      await page.goto('/tools/conduit')
      await expect(page).toHaveTitle(/配管サイズ/)
      await expect(page.locator('text=配管サイズ自動選定').first()).toBeVisible()
    })

    test('should load Cable Weight Calculator page', async ({ page }) => {
      await page.goto('/tools/weight')
      await expect(page).toHaveTitle(/ケーブル重量/)
      await expect(page.locator('text=ケーブル種別').first()).toBeVisible()
    })

    test('should access dashboard as admin and view menu items', async ({ page }) => {
      await page.goto('/')
      await expect(page.locator('text=Elec-Console').first()).toBeVisible()
      await expect(page.locator('text=現場ポータル').first()).toBeVisible()
    })

    test('should navigate to portal and view test site', async ({ page }) => {
      await page.goto('/portal')
      await expect(page).toHaveURL(/\/portal/)
      await expect(page.locator('text=現場ポータル').first()).toBeVisible()
    })
  })
})
