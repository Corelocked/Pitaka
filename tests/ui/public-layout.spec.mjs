import { test, expect } from '@playwright/test'
import { mockAccount } from './fixtures.mjs'

for (const scheme of ['light', 'dark']) {
  test(`public pages share one aligned header in ${scheme} mode`, async ({ page }, testInfo) => {
    test.setTimeout(90000)
    await mockAccount(page, { authenticated: false })
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
    const widths = testInfo.project.name === 'phone' ? [320, 412, 740] : [768, 1280, 1440]
    for (const width of widths) {
      await page.setViewportSize({ width, height: width === 740 ? 360 : 900 })
      for (const path of ['/', '/features', '/pricing', '/blogs', '/blogs/create-budget-that-works']) {
        await page.goto(path)
        await expect(page.locator('h1').first()).toBeVisible({ timeout: 20000 })
        const header = page.locator('.public-header')
        await expect(header).toHaveCount(1)
        await expect(page.locator('img[src="/pitaka-logo.png"]')).toHaveCount(1)
        await expect(header.getByRole('link', { name: 'Sign in', exact: true })).toHaveCount(1)
        if (path === '/') {
          await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toHaveCount(1)
          await expect(page.locator('.landing-hero').getByRole('button')).toHaveCount(1)
          if (width <= 412) {
            const lines = await page.locator('h1').evaluate(element => element.getBoundingClientRect().height / parseFloat(getComputedStyle(element).lineHeight))
            expect(lines, 'Phone headline should not become a five-line column').toBeLessThanOrEqual(3.1)
          }
          await expect(page.locator('.landing-cta-shell p')).toHaveCSS('color', 'rgb(255, 255, 255)')
          await page.screenshot({ path: testInfo.outputPath(`landing-${width}.png`) })
        }
        if (path === '/blogs') {
          const contrast = await page.locator('.blog-featured-button, .blog-read-more').evaluateAll(elements => elements.map(element => {
            const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0)
            const style = getComputedStyle(element)
            const text = luminance(style.color)
            const background = luminance(style.backgroundColor)
            return (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05)
          }))
          expect(Math.min(...contrast), 'Guide buttons must have readable text in both themes').toBeGreaterThanOrEqual(4.5)
        }
        if (path === '/features' || path.startsWith('/blogs')) {
          await expect(header.locator('nav [aria-current="page"]')).toHaveText(path === '/features' ? 'Features' : 'Guides')
        }
        for (const scale of [1, 2]) {
          await page.evaluate(scale => { document.documentElement.style.fontSize = `${scale * 100}%`; document.body.style.fontSize = '1rem' }, scale)
          const layout = await header.evaluate(element => {
            const brand = element.querySelector('.public-brand')
            const icon = brand.querySelector('img').getBoundingClientRect()
            const name = brand.querySelector('span').getBoundingClientRect()
            const controls = [...element.querySelectorAll('a')].map(link => link.getBoundingClientRect())
            return {
              overflow: document.documentElement.scrollWidth - innerWidth,
              alignment: Math.abs((icon.top + icon.height / 2) - (name.top + name.height / 2)),
              small: controls.some(box => box.height < 44 || box.width < 44),
              overlap: controls.some((a, i) => controls.slice(i + 1).some(b => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1))
            }
          })
          expect(layout.overflow, `${path}, ${width}px, ${scale}x text`).toBeLessThanOrEqual(1)
          expect(layout.alignment).toBeLessThanOrEqual(1)
          expect(layout.small, 'Header links need comfortable tap targets').toBe(false)
          expect(layout.overlap, 'Header links must not overlap').toBe(false)
        }
      }
    }
    await page.goto('/')
    const signIn = page.locator('.public-header').getByRole('link', { name: 'Sign in', exact: true })
    await signIn.focus()
    expect(await signIn.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none')
    await signIn.click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
    await page.goto('/')
    await page.getByRole('button', { name: 'Get started free', exact: true }).click()
    await expect(page).toHaveURL(/\/signup$/)
    await expect(page.getByRole('button', { name: 'Create account', exact: true })).toBeVisible()
  })
}
