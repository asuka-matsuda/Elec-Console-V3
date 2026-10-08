import { expect, test } from '@playwright/test'

import { loginAsAdmin } from './helpers/auth'

test.describe('Power Transmission Examination Workflow', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAsAdmin(context, page)
  })

  test('should access souden dashboard for test site', async ({ page }) => {
    await page.goto('/portal/test/souden')
    await expect(page).toHaveTitle(/送電試験/)
    await expect(page.locator('text=総合進捗').first()).toBeVisible()
    await expect(page.locator('text=全試験完了率').first()).toBeVisible()
    await expect(page.locator('text=帳票を出力する').first()).toBeVisible()
  })

  test('should render Phase 1 examination page with phase header and navigation', async ({ page }) => {
    await page.goto('/portal/test/phase1')
    await expect(page).toHaveTitle(/フェーズ1/)
    await expect(page.locator('text=フェーズ1 進捗状況').first()).toBeVisible()
    await expect(page.locator('text=盤種別:').first()).toBeVisible()
    await expect(page.locator('nav').locator('text=送電試験').first()).toBeVisible()
  })

  test('should render Phase 2 examination page with insulation measurement table', async ({ page }) => {
    await page.goto('/portal/test/phase2')
    await expect(page).toHaveTitle(/フェーズ2/)
    await expect(page.locator('text=フェーズ2 進捗状況').first()).toBeVisible()
    await expect(page.locator('text=盤名称:').first()).toBeVisible()
    await expect(page.locator('text=測定1').first()).toBeVisible()
    await expect(page.locator('text=測定2').first()).toBeVisible()
  })

  test('should render Phase 3 examination page with voltage & phase rotation check', async ({ page }) => {
    await page.goto('/portal/test/phase3')
    await expect(page).toHaveTitle(/フェーズ3/)
    await expect(page.locator('text=フェーズ3 進捗状況').first()).toBeVisible()
    await expect(page.locator('text=電圧1').first()).toBeVisible()
    await expect(page.locator('text=検相 / 点灯').first()).toBeVisible()
  })
})
