import { expect, test } from '@playwright/test'

test('measures local dictionary loading and analysis', async ({ page }) => {
  const startedAt = performance.now()
  await page.goto('/')
  await expect(page.getByRole('status')).toContainText('文章を入力してください', {
    timeout: 30_000,
  })

  const measurements: Record<string, string | undefined> = {
    firstReadyMs: (performance.now() - startedAt).toFixed(1),
    dictionaryLoadMs: await page.locator('html').getAttribute('data-dictionary-load-ms') ?? undefined,
    initializeMs: await page.locator('html').getAttribute('data-initialize-ms') ?? undefined,
  }
  const textarea = page.getByLabel('点検する文章')

  for (const size of [1_000, 10_000]) {
    const unit = '文章の内容を丁寧に確認します。'
    const text = unit.repeat(Math.ceil(size / unit.length)).slice(0, size)
    const previousResultId = await page.locator('html').getAttribute('data-result-id')
    await textarea.fill(text)
    await expect.poll(
      () => page.locator('html').getAttribute('data-result-id'),
      { timeout: 30_000 },
    ).not.toBe(previousResultId)
    measurements[`analyze${size}Ms`] =
      await page.locator('html').getAttribute('data-analyze-ms') ?? undefined
    measurements[`tokens${size}`] =
      await page.locator('html').getAttribute('data-token-count') ?? undefined
  }

  await textarea.fill('😀この機能は既定では静かに無視されます。')
  await expect(page.getByRole('status')).toContainText('2件の表現を見つけました')
  await page.screenshot({ path: '/tmp/kotoba-check-desktop.png', fullPage: true })
  console.log(`BENCHMARK ${JSON.stringify(measurements)}`)
})
