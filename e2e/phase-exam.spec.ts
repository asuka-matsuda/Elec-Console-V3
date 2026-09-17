import { expect, test } from '@playwright/test'

import { loginAsAdmin } from './helpers/auth'

test.describe('Power Transmission Examination Workflow', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAsAdmin(context, page)
  })

  test('should access souden dashboard for test site', async ({ page }) => {
    await page.goto('/portal/test/souden')
    await expect(page).toHaveTitle(/送電試験ダッシュボード/)
    await expect(page.locator('text=送電試験ダッシュボード').first()).toBeVisible()
    await expect(page.locator('text=ポータルへ戻る').first()).toBeVisible()
  })

  test('should render Phase 1 examination page with phase header and navigation', async ({ page }) => {
    await page.goto('/portal/test/phase1')
    await expect(page).toHaveTitle(/フェーズ1/)
    await expect(page.locator('text=フェーズ1：回路確認・増締').first()).toBeVisible()
    await expect(page.locator('text=ダッシュボードへ戻る').first()).toBeVisible()
  })

  test('should render Phase 2 examination page with insulation measurement table', async ({ page }) => {
    await page.goto('/portal/test/phase2')
    await expect(page).toHaveTitle(/フェーズ2/)
    await expect(page.locator('text=フェーズ2：絶縁抵抗測定').first()).toBeVisible()
    await expect(page.locator('text=一括 100MΩ(OK) 確定').first()).toBeVisible()
  })

  test('should render Phase 3 examination page with voltage & phase rotation check', async ({ page }) => {
    await page.goto('/portal/test/phase3')
    await expect(page).toHaveTitle(/フェーズ3/)
    await expect(page.locator('text=フェーズ3：送電・電圧測定・検相').first()).toBeVisible()
    await expect(page.locator('text=ダッシュボードへ戻る').first()).toBeVisible()
  })
})
