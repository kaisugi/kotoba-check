import { expect, test } from '@playwright/test'

test('loads Lindera in a Worker and connects findings to the textarea', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ことば点検')
  await expect(page.locator('.intro')).toContainText('登録した表現辞書と形態素解析で')
  await expect(page.locator('.intro')).toContainText('外部へ送信・保存されません')
  await expect(page.getByText('Japanese writing checker')).toHaveCount(0)
  await expect(page.getByText('書いたことばを、')).toHaveCount(0)
  await expect(page.locator('.principles')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'GitHubでソースコードを見る' })).toHaveAttribute(
    'href',
    'https://github.com/kaisugi/kotoba-check',
  )
  await expect(page.locator('.acknowledgement')).toContainText('p1ass氏')
  await expect(page.getByRole('link', { name: 'ライセンス・謝辞' })).toHaveAttribute('href', '/licenses.html')
  await expect(page.getByRole('status')).toContainText('文章を入力してください', {
    timeout: 30_000,
  })

  const textarea = page.getByLabel('点検する文章')
  await textarea.fill('😀この機能は既定では静かに無視されます。')
  await expect(page.getByRole('status')).toContainText('2件の表現を見つけました')
  await expect(page.locator('.issue-card')).toHaveCount(2)

  await page.locator('.issue-card').first().click()
  const selected = await textarea.evaluate((element) =>
    element.value.slice(element.selectionStart, element.selectionEnd),
  )
  // The upstream rule matches the morphemes 「既定」+「で」; 「は」 is outside its range.
  expect(selected).toBe('既定で')

  await textarea.fill('<img src=x onerror=alert(1)> 経路')
  await expect(page.getByRole('status')).toContainText('1件の表現を見つけました')
  await expect(page.locator('#preview img')).toHaveCount(0)
  await expect(page.locator('#preview')).toContainText('<img src=x onerror=alert(1)>')
})

test('does not create horizontal overflow at a mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await expect(page.locator('body')).toBeVisible()
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasOverflow).toBe(false)
})
