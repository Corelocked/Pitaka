import { test, expect } from '@playwright/test'
import { mockAccount } from './fixtures.mjs'
import { PUBLIC_PAGES } from '../../src/content/site.mjs'

test('public pages have distinct metadata and fit small screens', async ({ page }) => {
  test.setTimeout(60000)
  await mockAccount(page, { authenticated: false })
  for (const [path, metadata] of Object.entries(PUBLIC_PAGES)) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name: metadata.heading })).toBeVisible()
    await expect(page).toHaveTitle(metadata.title)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://pitaka-sigma.vercel.app${path}`)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index, follow/)
    await expect(page.locator('#pitaka-page-schema')).toHaveCount(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), path).toBeLessThanOrEqual(1)
  }
})

test('blog links work with browser history and article metadata', async ({ page }) => {
  await mockAccount(page, { authenticated: false })
  await page.goto('/blogs')
  const article = page.locator('.blog-featured').getByRole('link', { name: 'Read guide', exact: true })
  await expect(article).toHaveAttribute('href', '/blogs/create-budget-that-works')
  await article.click()
  await expect(page).toHaveURL(/\/blogs\/create-budget-that-works$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('How to Create a Budget That Fits Your Month')
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article')
  await expect(page.getByRole('heading', { name: 'Sources and further reading' })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Pitaka Blog', exact: true })).toBeVisible()
  await expect(page.locator('meta[property^="article:"]')).toHaveCount(0)
})

test('unknown pages and signed-out account screens stay out of search', async ({ page }) => {
  await mockAccount(page, { authenticated: false })
  for (const path of ['/not-a-page', '/blogs/missing-post', '/login', '/signup', '/dashboard', '/settings']) {
    await page.goto(path)
    await expect(page.locator('h1').filter({ visible: true }).first()).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0)
  }
})

test('signed-in finance screens have private metadata', async ({ page }) => {
  await mockAccount(page)
  await page.goto('/dashboard')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0)
  await expect(page.locator('meta[property^="article:"]')).toHaveCount(0)
})

test('public information stays readable while sign-in is resolving', async ({ page }) => {
  await mockAccount(page, { authenticated: false, authLoading: true })
  await page.goto('/features')
  await expect(page.getByRole('heading', { level: 1, name: PUBLIC_PAGES['/features'].heading })).toBeVisible()
  await page.goto('/dashboard')
  await expect(page.getByText('Loading Pitaka...', { exact: true })).toBeVisible()
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
})
