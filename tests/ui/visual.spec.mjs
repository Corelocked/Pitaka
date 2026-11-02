import { test, expect } from '@playwright/test'
import { mockAccount } from './fixtures.mjs'

const viewports = [
  { width: 320, height: 640 },
  { width: 412, height: 915 },
  { width: 600, height: 960 },
  { width: 1280, height: 800 },
  { width: 740, height: 360 }
]

async function expectFits(page, route) {
  const layout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - innerWidth,
    clippedControls: [...document.querySelectorAll('button, input, select, textarea')]
      .filter(element => element.checkVisibility() && !element.closest('[aria-hidden="true"]'))
      .filter(element => {
        const box = element.getBoundingClientRect()
        const scrollableTable = element.closest('.table-wrapper')
        const canScroll = scrollableTable && getComputedStyle(scrollableTable).overflowX === 'auto'
          && scrollableTable.scrollWidth > scrollableTable.clientWidth
        return (!canScroll && (box.left < -1 || box.right > innerWidth + 1))
          || (element.tagName === 'BUTTON' && (
            element.scrollWidth > element.clientWidth + 1
            || element.scrollHeight > element.clientHeight + 1
          ))
      })
      .map(element => element.getAttribute('aria-label') || element.textContent || element.id)
  }))
  expect.soft(layout.overflow, `${route}: horizontal overflow`).toBeLessThanOrEqual(1)
  expect.soft(layout.clippedControls, `${route}: clipped controls`).toEqual([])
}

for (const viewport of viewports) {
  for (const scheme of ['light', 'dark']) {
    const label = `${viewport.width}x${viewport.height} ${scheme}`

    test(`public screens fit and embedded sign-in stays compact: ${label}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport)
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      await mockAccount(page, { authenticated: false })
      for (const route of ['/delete-account', '/login', '/signup', '/', '/blogs', '/privacy-policy.html']) {
        await page.goto(route)
        await expect(page.locator('h1').filter({ visible: true }).first()).toBeVisible()
        if (route === '/delete-account') {
          await expect(page.locator('input[type="email"]')).toBeVisible()
          expect(await page.locator('meta[name="viewport"]').getAttribute('content')).toContain('viewport-fit=contain')
          const space = await page.locator('.auth-container').evaluate(element => {
            const shell = element.querySelector('.auth-shell')
            const card = element.querySelector('.auth-card')
            const mark = element.querySelector('.auth-app-mark')
            return {
              outer: element.getBoundingClientRect().height - shell.getBoundingClientRect().height,
              inner: mark.getBoundingClientRect().top - card.getBoundingClientRect().top - parseFloat(getComputedStyle(card).paddingTop)
            }
          })
          expect(space.outer, 'Embedded auth must not add a screen of empty space').toBeLessThanOrEqual(1)
          expect(space.inner, 'Embedded auth content starts at its padding').toBeLessThanOrEqual(1)
          await page.locator('.auth-container').scrollIntoViewIfNeeded()
          await page.screenshot({ path: testInfo.outputPath('delete-account.png') })
        }
        await expectFits(page, route)
        await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; document.body.style.fontSize = '1rem' })
        await expectFits(page, `${route} at 200% text`)
      }
    })

    test(`finance screens and confirmations fit at normal and enlarged text: ${label}`, async ({ page }, testInfo) => {
      test.setTimeout(60000)
      await page.setViewportSize(viewport)
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      await mockAccount(page, { planningData: true, manyAccounts: true })
      for (const route of ['dashboard', 'transactions', 'accounts', 'plan', 'wealth', 'categories', 'investments', 'subscriptions', 'recurring-income', 'settings', 'contact', 'privacy', 'pro', 'android-app', 'delete-account']) {
        await page.goto(`/${route}`)
        await expect(page.locator('.mobile-content')).toBeVisible()
        await expect(page.getByText('Preparing the next view.', { exact: true })).toHaveCount(0)
        await expectFits(page, route)
        if (['dashboard', 'accounts', 'plan', 'settings', 'pro'].includes(route)) {
          await page.screenshot({ path: testInfo.outputPath(`${route}.png`) })
        }
        await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; document.body.style.fontSize = '1rem' })
        await expectFits(page, `${route} at 200% text`)
      }
      await page.goto('/settings')
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; document.body.style.fontSize = '1rem' })
      await page.getByRole('button', { name: /^sign out$/i }).last().click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      const box = await dialog.boundingBox()
      expect(box.y, 'Confirmation stays below the top of the screen').toBeGreaterThanOrEqual(0)
      expect(box.y + box.height, 'Confirmation stays above the bottom of the screen').toBeLessThanOrEqual(viewport.height)
      await expectFits(page, 'sign-out confirmation at 200% text')
      await page.getByRole('button', { name: 'Stay signed in' }).click()
      await page.goto('/accounts')
      await expect(page.locator('.table-wrapper')).toBeVisible()
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; document.body.style.fontSize = '1rem' })
      const details = page.locator('.table-mobile-summary-button').first()
      if (await details.isVisible()) await details.click()
      await page.getByRole('button', { name: 'Delete Everyday bank', exact: true }).click()
      const deletion = page.getByRole('dialog')
      await expect(deletion).toBeVisible()
      const deletionBox = await deletion.boundingBox()
      expect(deletionBox.y).toBeGreaterThanOrEqual(0)
      expect(deletionBox.y + deletionBox.height).toBeLessThanOrEqual(viewport.height)
      await expectFits(page, 'account deletion confirmation at 200% text')
      await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    })
  }
}
