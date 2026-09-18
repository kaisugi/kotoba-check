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
  await page.locator('#rules-settings summary').click()
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasOverflow).toBe(false)
})

test('switches expression rules without saving the text', async ({ page }) => {
  await page.goto('/')
  const textarea = page.getByLabel('点検する文章')
  await textarea.fill('機械の部品を検査します。')
  await expect(page.getByRole('status')).toContainText('2件の表現を見つけました', { timeout: 30_000 })

  await page.locator('#rules-settings summary').click()
  const resultId = await page.locator('html').getAttribute('data-result-id')
  await page.getByLabel('表現を探す').fill('検査')
  await page.getByRole('checkbox', { name: '検査' }).uncheck()
  await expect(page.locator('.issue-card')).toHaveCount(1)
  await expect(page.locator('#preview .highlight')).toHaveCount(1)
  await expect(page.getByRole('status')).toContainText('1件の表現を見つけました')

  await page.getByLabel('表現を探す').fill('部品')
  await page.getByRole('checkbox', { name: '部品' }).uncheck()
  await expect(page.locator('.issue-card')).toHaveCount(0)
  await expect(page.getByRole('status')).toContainText('指摘はありません')
  await expect(page.locator('html')).toHaveAttribute('data-result-id', resultId!)

  await page.reload()
  await expect(textarea).toHaveValue('')
  await page.locator('#rules-settings summary').click()
  await expect(page.getByRole('checkbox', { name: '検査' })).not.toBeChecked()
  await expect(page.getByRole('checkbox', { name: '部品' })).not.toBeChecked()
  await page.getByRole('button', { name: 'すべてオン' }).click()
  await expect(page.getByRole('checkbox', { name: '検査' })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: '部品' })).toBeChecked()
  await page.getByRole('button', { name: 'すべてオフ' }).click()
  await expect(page.locator('#enabled-rule-count')).toContainText('0 /')
  await textarea.fill('機械の部品を検査します。')
  await expect(page.getByRole('status')).toContainText('表現ルールがすべてオフです')
})

test('keeps findings visible while reading a long desktop preview', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.getByLabel('点検する文章').fill(`部品を確認します。\n${'長い文章を読み進めます。\n'.repeat(180)}`)
  await expect(page.locator('.issue-card')).toHaveCount(1, { timeout: 30_000 })

  await page.evaluate(() => window.scrollTo(0, 1200))
  await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000)
  const positions = await page.evaluate(() => ({
    issuesTop: document.querySelector('.issues-panel')!.getBoundingClientRect().top,
    previewBottom: document.querySelector('.result-panel')!.getBoundingClientRect().bottom,
  }))
  expect(positions.issuesTop).toBeGreaterThanOrEqual(0)
  expect(positions.issuesTop).toBeLessThan(100)
  expect(positions.previewBottom).toBeGreaterThan(800)
})

test('scrolls the textarea to a finding in a long wrapped paragraph', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  const textarea = page.getByLabel('点検する文章')
  await textarea.fill(`${'長い文章を読み進めます。'.repeat(180)}部品を確認します。`)
  await expect(page.locator('.issue-card')).toHaveCount(1, { timeout: 30_000 })
  await page.evaluate(() => window.scrollTo(0, 1200))
  await page.locator('.issue-card').click()
  const state = await textarea.evaluate((element) => ({
    selected: element.value.slice(element.selectionStart, element.selectionEnd),
    scrollTop: element.scrollTop,
    maxScroll: element.scrollHeight - element.clientHeight,
    top: element.getBoundingClientRect().top,
  }))
  expect(state.selected).toBe('部品')
  expect(state.scrollTop).toBeGreaterThan(state.maxScroll * 0.8)
  expect(state.top).toBeGreaterThanOrEqual(0)
  expect(state.top).toBeLessThan(800)

  await textarea.evaluate((element) => { element.scrollTop = 0 })
  await page.evaluate(() => window.scrollTo(0, 1200))
  await page.locator('.issue-card').click()
  const second = await textarea.evaluate((element) => ({
    selected: element.value.slice(element.selectionStart, element.selectionEnd),
    scrollTop: element.scrollTop,
    maxScroll: element.scrollHeight - element.clientHeight,
    top: element.getBoundingClientRect().top,
  }))
  expect(second.selected).toBe('部品')
  expect(second.scrollTop).toBeGreaterThan(second.maxScroll * 0.8)
  expect(second.top).toBeGreaterThanOrEqual(0)
  expect(second.top).toBeLessThan(800)
})
