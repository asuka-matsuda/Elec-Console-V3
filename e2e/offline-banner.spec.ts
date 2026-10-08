import { expect, test } from '@playwright/test'

import { loginAsAdmin } from './helpers/auth'

test.describe('Offline Banner & Resilience Tests', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAsAdmin(context, page)
  })

  test('should show HUD offline banner when network is disconnected and recover on reconnect', async ({ page }) => {
    await page.goto('/reference/glossary')
    await page.waitForLoadState('networkidle')

    const offlineText = page.locator('text=圏外（オフライン）で動作中')

    await expect(offlineText).not.toBeVisible()

    // Chrome DevTools Protocol (CDP) でブラウザの完全オフラインをエミュレート
    const cdp = await page.context().newCDPSession(page)

    await cdp.send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    })

    // 念のため window イベントもトリガー
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'))
    })

    // 警告バナーの出現を確認
    await expect(offlineText).toBeVisible({ timeout: 5000 })

    // オンラインに復帰
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    })
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'))
    })

    // 復帰バナーが表示されることを確認
    const onlineText = page.locator('text=オンラインに復帰しました')

    await expect(onlineText).toBeVisible({ timeout: 5000 })
  })
})
