import { test, expect } from '@playwright/test'
import { mockAccount } from './fixtures.mjs'

for (const scheme of ['light', 'dark'])
  test(`workspace alignment and controls stay consistent in ${scheme} mode`, async ({
    page
  }) => {
    await page.emulateMedia({ colorScheme: scheme })
    await mockAccount(page, { planningData: true })
    const appearance = (locator) =>
      locator.evaluate((element) => {
        const style = getComputedStyle(element)
        return {
          font: style.fontSize,
          family: style.fontFamily,
          radius: style.borderRadius,
          height: style.minHeight,
          background: style.backgroundColor,
          color: style.color
        }
      })
    await page.goto('/dashboard')
    const primary = await appearance(
      page.locator('.quick-actions button').first()
    )
    await page
      .getByRole('navigation', { name: 'Primary navigation' })
      .filter({ visible: true })
      .getByRole('button', { name: 'Accounts', exact: true })
      .click()
    const addAccount = page.getByRole('button', { name: /Add account/i })
    await expect(addAccount).toBeVisible()
    expect(await appearance(addAccount)).toEqual(primary)
    await addAccount.click()
    const sheet = page.getByRole('dialog')
    await expect(sheet.getByLabel('Account Name')).toBeVisible()
    expect(
      await appearance(
        sheet.getByRole('button', { name: 'Add account', exact: true })
      )
    ).toEqual(primary)
    await page.getByRole('button', { name: 'Close sheet' }).click()
    expect(
      await appearance(page.locator('.quick-actions button').first())
    ).toEqual(primary)

    let metricStyle
    for (const path of [
      'dashboard',
      'transactions',
      'accounts',
      'plan',
      'wealth',
      'categories',
      'investments',
      'subscriptions',
      'recurring-income',
      'settings',
      'contact',
      'privacy',
      'pro',
      'android-app',
      'delete-account'
    ]) {
      await page.goto(`/${path}`)
      await expect(page.locator('.mobile-content')).toBeVisible()
      const edges = await page.evaluate(() => {
        const content = document.querySelector('.mobile-content')
        const header = document.querySelector('.mobile-header-content')
        const contentStyle = getComputedStyle(content)
        return {
          content:
            content.getBoundingClientRect().left +
            parseFloat(contentStyle.paddingLeft),
          header: header.getBoundingClientRect().left
        }
      })
      expect(
        Math.abs(edges.content - edges.header),
        `${path} header and content alignment`
      ).toBeLessThan(1)
      await expect(page.locator('.page-intro-title')).toHaveCount(0)
      const framedSections = await page.locator('.mobile-content').evaluate((content) =>
        [...content.querySelectorAll('.card, .workspace-summary-stats, .overview-metric, .plan-tool, .layout-preference-card, .budget-coverage-item, .plan-tier-card, .pro-purchase-card, .pro-purchase-meta-card, .settings-preferences > summary')]
          .filter((element) => element.checkVisibility())
          .map((element) => ({
            name: element.className,
            background: getComputedStyle(element).backgroundColor,
            borders: ['Top', 'Right', 'Bottom', 'Left'].map((side) => getComputedStyle(element)[`border${side}Width`]),
            shadow: getComputedStyle(element).boxShadow
          }))
          .filter((style) => style.background !== 'rgba(0, 0, 0, 0)' || style.borders.some((width) => width !== '0px') || style.shadow !== 'none')
      )
      expect(framedSections, `${path} content sections stay borderless`).toEqual([])
      const metric = page.locator('.workspace-stat > strong').first()
      if (await metric.count()) {
        const style = await metric.evaluate((element) => {
          const computed = getComputedStyle(element)
          return { font: computed.fontSize, weight: computed.fontWeight, line: computed.lineHeight, spacing: computed.letterSpacing }
        })
        if (!metricStyle) metricStyle = style
        expect(style, `${path} uses the shared summary typography`).toEqual(metricStyle)
      }
      if (path === 'plan') {
        const spacing = await page.locator('.plan-workspace').evaluate((content) => {
          const style = getComputedStyle(content)
          const intro = content.querySelector('.plan-welcome')
          const welcome = intro.getBoundingClientRect()
          const introStyle = getComputedStyle(intro)
          const childHeights = [...intro.children].map((child) => child.getBoundingClientRect().height)
          const tools = content.querySelector('.plan-tools').getBoundingClientRect()
          return {
            top: welcome.top - content.getBoundingClientRect().top,
            padding: parseFloat(style.paddingTop),
            gap: tools.top - welcome.bottom,
            expectedGap: parseFloat(style.gap),
            introHeight: welcome.height,
            expectedIntroHeight: introStyle.flexDirection === 'column'
              ? childHeights.reduce((sum, height) => sum + height, 0) + parseFloat(introStyle.gap)
              : Math.max(...childHeights)
          }
        })
        expect(spacing.top, 'Plan starts at the standard page inset').toBe(spacing.padding)
        expect(spacing.gap, 'Plan sections use the shared gap').toBe(spacing.expectedGap)
        expect(spacing.introHeight, 'The introduction must not stretch to fill the screen').toBe(spacing.expectedIntroHeight)
      }
    }
    await page.goto('/settings')
    await page
      .getByRole('button', { name: /^sign out$/i })
      .last()
      .click()
    const dialogColors = await page.getByRole('dialog').evaluate((element) => {
      const sample = document.createElement('span')
      sample.style.backgroundColor = 'var(--card-background)'
      element.append(sample)
      const colors = {
        dialog: getComputedStyle(element).backgroundColor,
        surface: getComputedStyle(sample).backgroundColor
      }
      sample.remove()
      return colors
    })
    expect(dialogColors.dialog).toBe(dialogColors.surface)
    await page.getByRole('button', { name: 'Stay signed in' }).click()
  })

test('snapshot sync settles and status changes never shift the dashboard', async ({
  page
}) => {
  await mockAccount(page)
  await page.goto('/dashboard')
  await expect(page.locator('.overview-balance')).toBeVisible()
  const sample = () =>
    page.evaluate(async () => {
      const tops = []
      for (let index = 0; index < 30; index++) {
        await new Promise(requestAnimationFrame)
        tops.push(
          document.querySelector('.overview-balance').getBoundingClientRect()
            .top
        )
      }
      return {
        writes: window.__snapshotWrites.length,
        shift: Math.max(...tops) - Math.min(...tops)
      }
    })
  const initial = await sample()
  expect(
    initial.writes,
    'A snapshot acknowledgement must not trigger another write'
  ).toBe(1)
  expect(
    initial.shift,
    'Sync status must not move the balance card'
  ).toBeLessThan(1)

  const top = await page
    .locator('.overview-balance')
    .evaluate((element) => element.getBoundingClientRect().top)
  await page.evaluate(() =>
    window.__setFixtureSync({ fromCache: false, hasPendingWrites: true })
  )
  await expect(page.getByRole('status')).toContainText(/sync/i)
  expect(
    await page
      .locator('.overview-balance')
      .evaluate((element) => element.getBoundingClientRect().top)
  ).toBe(top)
  await page.evaluate(() =>
    window.__setFixtureSync({ fromCache: false, hasPendingWrites: false })
  )

  await page
    .locator('.quick-actions')
    .getByRole('button', { name: /income/i })
    .click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Income Source').fill('Bonus')
  await dialog.getByLabel('Amount (PHP)', { exact: true }).fill('25')
  await dialog.getByLabel(/^Account/).selectOption('bank')
  await dialog.getByRole('button', { name: 'Add income', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  const changed = await sample()
  expect(changed.writes, 'A changed balance should be recorded once').toBe(2)
  expect(changed.shift).toBeLessThan(1)
})

test('native widgets keep mixed currencies separate', async ({ page }) => {
  await mockAccount(page, { native: true, mixed: true })
  await page.goto('/dashboard')
  await expect
    .poll(() =>
      page.evaluate(() => window.__widgetSnapshot?.expense.rows.length)
    )
    .toBe(2)
  const snapshot = await page.evaluate(() => window.__widgetSnapshot)
  expect(snapshot.expense.chart.segments).toEqual([])
  expect(snapshot.accountAllocations.chart.segments).toEqual([])
  expect(snapshot.expense.rows.map((row) => row.label)).toEqual(['PHP', 'USD'])
  expect(
    snapshot.accountAllocations.rows.every((row) => !row.hint.includes('%'))
  ).toBeTruthy()
})

const nav = (page) =>
  page
    .getByRole('navigation', { name: 'Primary navigation' })
    .filter({ visible: true })

test('home, unified activity, filters, planning, settings, and privacy', async ({
  page
}, testInfo) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await mockAccount(page)
  await page.goto('/dashboard')
  await expect(
    page.getByRole('heading', { name: 'Home', exact: true })
  ).toBeVisible()
  await expect(page.locator('.overview-balance-value')).toContainText(
    '77,089.25'
  )
  await page.screenshot({
    path: testInfo.outputPath('home.png'),
    fullPage: true
  })
  await nav(page).getByRole('button', { name: 'Activity', exact: true }).click()
  await expect(page.getByText('Monthly salary', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Expenses', exact: true }).click()
  await expect(page.getByText('Monthly salary', { exact: true })).toHaveCount(0)
  await page
    .getByRole('searchbox', { name: 'Search transactions' })
    .fill('groceries')
  await expect(page.locator('.activity-entry')).toHaveCount(1)
  await expect(
    page.locator('.activity-summary > div:last-child strong')
  ).toHaveText('1')
  await page.locator('.activity-entry summary').click()
  await expect(page.getByRole('button', { name: 'Edit expense' })).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('activity.png'),
    fullPage: true
  })
  await nav(page).getByRole('button', { name: 'Plan', exact: true }).click()
  await page.getByRole('button', { name: /Budgets & categories/ }).click()
  await expect(
    nav(page).getByRole('button', { name: 'Plan', exact: true })
  ).toHaveAttribute('aria-current', 'page')
  await nav(page).getByRole('button', { name: 'More', exact: true }).click()
  await expect(page.getByText('Appearance & preferences')).toBeVisible()
  await page.getByRole('button', { name: 'Privacy & security' }).click()
  await expect(page).toHaveURL(/\/privacy$/)
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Privacy', exact: true })
  ).toBeVisible()
  expect(errors).toEqual([])
})

test('entry saving, editing reset, dialog focus, and deletion confirmation', async ({
  page
}) => {
  await mockAccount(page)
  await page.goto('/transactions')
  await page
    .locator('.quick-actions')
    .getByRole('button', { name: /income/i })
    .click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Income Source').fill('Side project')
  await dialog.getByLabel(/Amount/).fill('1250.25')
  await dialog.getByLabel(/^Account/).selectOption('cash')
  await dialog.getByRole('button', { name: 'Add income', exact: true }).click()
  await expect(dialog.getByRole('button', { name: 'Saving…' })).toBeDisabled()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByText('Side project', { exact: true })).toBeVisible()
  await page.getByText('Side project', { exact: true }).click()
  await page.getByRole('button', { name: 'Edit income', exact: true }).click()
  await expect(dialog.getByLabel('Income Source')).toHaveValue('Side project')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await page
    .locator('.quick-actions')
    .getByRole('button', { name: /income/i })
    .click()
  await expect(dialog.getByLabel('Income Source')).toHaveValue('')
  await page.keyboard.press('Shift+Tab')
  await expect(
    dialog.getByRole('button', { name: 'Add income', exact: true })
  ).toBeFocused()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(
    page.getByRole('dialog', { name: 'Delete income?' })
  ).toBeVisible()
  await page.getByRole('button', { name: 'Keep transaction' }).click()
  await expect(page.getByText('Side project', { exact: true })).toBeVisible()
})

test('failed saves preserve input; older months never receive current net worth', async ({
  page
}) => {
  await mockAccount(page, { failSaves: true })
  await page.goto('/dashboard')
  await page.getByRole('button', { name: 'Show previous month' }).click()
  await expect(page.locator('.finance-home')).toBeVisible()
  const writes = await page.evaluate(() => window.__snapshotWrites)
  const today = new Date()
  expect(writes.length).toBeGreaterThan(0)
  expect(
    writes.every(
      (entry) =>
        entry.monthKey ===
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    )
  ).toBeTruthy()
  await page
    .locator('.quick-actions')
    .getByRole('button', { name: /expense/i })
    .click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Description', { exact: true }).fill('Groceries')
  await dialog
    .getByLabel('Category', { exact: true })
    .selectOption({ label: 'Food & groceries' })
  await dialog.getByLabel('Amount (PHP)', { exact: true }).fill('120.50')
  await dialog.getByRole('button', { name: 'Add expense', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('Could not save')
  await expect(dialog.getByLabel('Description', { exact: true })).toHaveValue(
    'Groceries'
  )
  await expect(
    dialog.getByRole('button', { name: 'Add expense', exact: true })
  ).toBeEnabled()
})

test('small screens, empty accounts, large text, and dark appearance', async ({
  page
}, testInfo) => {
  await mockAccount(page, { empty: true, pro: false })
  await page.setViewportSize({ width: 320, height: 740 })
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await page.goto('/dashboard')
  await expect(
    page.getByRole('button', { name: 'Add account', exact: true })
  ).toBeVisible()
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark')
  const overflowing = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth
  )
  expect(overflowing).toBeFalsy()
  await page.screenshot({
    path: testInfo.outputPath('empty-dark-large-text.png'),
    fullPage: true
  })
  await page.getByRole('button', { name: 'Add account', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Close sheet' }).click()
  await nav(page).getByRole('button', { name: 'Plan', exact: true }).click()
  await page.screenshot({
    path: testInfo.outputPath('plan-dark.png'),
    fullPage: true
  })
})

test('account, transfer, goal, and currency-specific budget workflows', async ({
  page
}) => {
  await mockAccount(page, { mixed: false })
  await page.goto('/accounts')
  await page.getByRole('button', { name: /Add account/i }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Account Name').fill('Travel cash')
  await dialog.getByLabel('Starting Balance').fill('500')
  await dialog.getByRole('button', { name: 'Add account', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await page
    .locator('.quick-actions')
    .getByRole('button', { name: 'Transfer', exact: true })
    .click()
  await dialog.getByLabel('From account').selectOption('bank')
  await dialog.getByLabel('To account').selectOption('cash')
  await dialog.getByLabel(/Amount/).fill('100')
  await dialog.getByRole('button', { name: /Transfer/ }).click()
  await expect(dialog).toHaveCount(0)
  await nav(page).getByRole('button', { name: 'Home', exact: true }).click()
  await expect(page.locator('.overview-balance-value')).toContainText(
    '77,589.25'
  )
  await nav(page).getByRole('button', { name: 'Plan', exact: true }).click()
  await page.getByRole('button', { name: 'New savings goal' }).click()
  await dialog.getByLabel('Savings Goal').fill('New laptop')
  await dialog.getByLabel(/Target Amount/).fill('40000')
  await dialog.getByRole('button', { name: /Add.*Saving/i }).click()
  await expect(dialog).toHaveCount(0)
  await page.getByRole('button', { name: /Budgets & categories/ }).click()
  await page.getByLabel('Category', { exact: true }).selectOption('food')
  await page.getByLabel('Budget currency').selectOption('USD')
  await page.getByLabel('Monthly Budget').fill('100')
  await page.getByRole('button', { name: /Save.*budget/i }).click()
  await expect
    .poll(() => page.evaluate(() => window.__fixtureData.budgets.length))
    .toBe(1)
  const saved = await page.evaluate(() => window.__fixtureData.budgets[0])
  expect(saved.amount).toBe(100)
  expect(saved.currency).toBe('USD')
  await expect(page.getByText(/Spent \$0\.00/)).toBeVisible()
  await page.locator('.budget-coverage-item').getByRole('button', { name: 'Edit', exact: true }).click()
  await expect(page.getByLabel('Monthly Budget')).toBeFocused()
  await expect(page.getByLabel('Monthly Budget')).toHaveValue('100')
  await nav(page).getByRole('button', { name: 'Accounts', exact: true }).click()
  const mobileAccount = page
    .locator('.table-mobile-item')
    .filter({ hasText: 'Travel cash' })
  if (await mobileAccount.count())
    await mobileAccount.locator('.table-mobile-summary-button').click()
  await page
    .getByRole('button', { name: 'Delete Travel cash', exact: true })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Delete account', exact: true })
    .click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByText('Travel cash', { exact: true })).toHaveCount(0)
})

test('every finance view fits and account deletion requires confirmation', async ({
  page
}, testInfo) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await mockAccount(page)
  for (const path of [
    'accounts',
    'wealth',
    'investments',
    'subscriptions',
    'recurring-income',
    'categories',
    'settings',
    'delete-account'
  ]) {
    await page.goto(`/${path}`)
    await expect(page.locator('.mobile-content')).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth
      ),
      path
    ).toBeFalsy()
    if (['accounts', 'wealth', 'settings'].includes(path))
      await page.screenshot({
        path: testInfo.outputPath(`${path}.png`),
        fullPage: true
      })
  }
  await expect(
    page.getByRole('button', { name: 'Permanently delete account' })
  ).toBeDisabled()
  await page
    .getByLabel('Type test@example.com to confirm')
    .fill('test@example.com')
  await page.getByLabel('Current password').fill('not-a-real-password')
  await expect(
    page.getByRole('button', { name: 'Permanently delete account' })
  ).toBeEnabled()
  expect(errors).toEqual([])
})

test('deletion page is available without an installed app or signed-in session', async ({
  page
}) => {
  await mockAccount(page, { authenticated: false, pro: false })
  await page.goto('/delete-account')
  await expect(
    page.getByRole('heading', { name: 'Delete your Pitaka account' })
  ).toBeVisible()
  await expect(page.getByText(/even if you’ve uninstalled/)).toBeVisible()
  await expect(page.locator('input[type="email"]')).toBeVisible()
})

test('Android Back dismisses sheets and navigates; external Pro checkout is absent', async ({
  page
}) => {
  await mockAccount(page, { native: true, pro: false })
  await page.goto('/pro')
  await expect(
    page.getByText('Pro features are not available for purchase', {
      exact: false
    })
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /PayMongo|Unlock Pro|Buy Pro/ })
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'Back to Plan' }).click()
  await page.getByRole('button', { name: 'New savings goal' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.evaluate(() => window.__nativeListeners.backButton())
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.evaluate(() => window.__nativeListeners.backButton())
  await expect(
    page.getByRole('heading', { name: 'Home', exact: true })
  ).toBeVisible()
})


test('reporting periods, list summaries, and settings tools are easy to reach', async ({ page }, testInfo) => {
  await mockAccount(page, { planningData: true })
  await page.goto('/dashboard')
  const month = page.getByLabel('Reporting month')
  const currentMonth = await month.inputValue()
  await month.fill('2025-02')
  await expect(page.locator('.overview-period h2')).toHaveText('February 2025')
  await page.getByRole('button', { name: 'Return to current month' }).click()
  await expect(month).toHaveValue(currentMonth)
  await nav(page).getByRole('button', { name: 'Accounts', exact: true }).click()
  if (testInfo.project.name === 'phone') {
    const bank = page.locator('.table-mobile-item').filter({ hasText: 'Everyday bank' })
    await expect(bank.locator('.table-mobile-summary-meta')).toContainText('72,649.25')
    await expect(bank.locator('.table-mobile-summary-button')).toHaveAttribute('aria-expanded', 'false')
  }
  await nav(page).getByRole('button', { name: 'Plan', exact: true }).click()
  await page.getByRole('button', { name: /Budgets & categories/ }).click()
  await expect(page.getByRole('heading', { name: 'Monthly budgets' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Add category/ })).toBeHidden()
  await page.locator('.categories-library > summary').click()
  await expect(page.getByRole('button', { name: /Add category/ })).toBeVisible()
  await page.getByRole('button', { name: 'Back to Plan' }).click()
  await expect(page.locator('.mobile-header h1')).toBeFocused()
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  await nav(page).getByRole('button', { name: 'More', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Export to Excel', exact: true })).toBeHidden()
  await page.locator('.settings-data > summary').click()
  await expect(page.getByRole('button', { name: 'Export to Excel', exact: true })).toBeVisible()
  await page.locator('.settings-preferences:not(.settings-data) > summary').click()
  const dark = page.getByRole('radio', { name: 'Dark', exact: true })
  await dark.check()
  await expect(dark).toBeChecked()
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark')
})

test('optional expense details survive saves and edits, with clear feedback', async ({ page }) => {
  await mockAccount(page)
  await page.goto('/transactions')
  await page.locator('.quick-actions button').first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByLabel('Notes', { exact: true })).toBeHidden()
  await dialog.getByLabel('Description', { exact: true }).fill('Lunch with team')
  await dialog.getByLabel('Category', { exact: true }).selectOption({ label: 'Food & groceries' })
  await dialog.getByLabel('Amount (PHP)', { exact: true }).fill('20')
  await dialog.getByLabel(/^Account/).selectOption('bank')
  await dialog.locator('.form-disclosure > summary').click()
  await dialog.getByLabel('Notes', { exact: true }).fill('Shared meal')
  await dialog.getByLabel('Tags', { exact: true }).fill('work, shared')
  await dialog.getByLabel('Split category', { exact: true }).selectOption({ label: 'Transport' })
  await dialog.getByLabel('Split amount', { exact: true }).fill('5')
  await dialog.getByRole('button', { name: 'Add expense', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('status').filter({ hasText: 'Expense added' })).toBeVisible()
  const split = await page.evaluate(() => window.__fixtureData.expenses.filter(entry => entry.description.startsWith('Lunch with team')))
  expect(split.map(entry => entry.amount).sort((a, b) => a - b)).toEqual([5, 15])
  expect(split.every(entry => entry.notes === 'Shared meal' && entry.tags.join(',') === 'work,shared')).toBeTruthy()
  const lunch = page.locator('.activity-entry').filter({ has: page.getByText('Lunch with team', { exact: true }) })
  await lunch.locator('summary').click()
  await lunch.getByRole('button', { name: 'Edit expense' }).click()
  await expect(dialog.getByLabel('Notes', { exact: true })).toBeVisible()
  await expect(dialog.getByLabel('Notes', { exact: true })).toHaveValue('Shared meal')
  await page.getByRole('button', { name: 'Close sheet' }).click()
  await page.getByRole('searchbox', { name: 'Search transactions' }).fill('Lunch with team')
  await expect(page.locator('.activity-filter-status')).toContainText('2 matching transactions')
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click()
  await expect(page.getByRole('searchbox', { name: 'Search transactions' })).toHaveValue('')
  await expect(page.locator('.activity-entry')).toHaveCount(5)
})

test('sign-in and registration let people check passwords without losing input', async ({ page }) => {
  await mockAccount(page, { authenticated: false })
  await page.goto('/login')
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme })
    await expect(page.locator('body')).toHaveAttribute('data-theme', scheme)
    await expect.poll(() => page.locator('#password').evaluate((input) => {
      const sample = document.createElement('span')
      sample.style.backgroundColor = 'var(--surface-muted)'
      sample.style.color = 'var(--text-primary)'
      input.parentElement.append(sample)
      const actual = getComputedStyle(input)
      const expected = getComputedStyle(sample)
      const colors = { fieldMatches: actual.backgroundColor === expected.backgroundColor, textMatches: actual.color === expected.color }
      sample.remove()
      return colors
    })).toEqual({ fieldMatches: true, textMatches: true })
  }
  await page.getByLabel('Password', { exact: true }).fill('sample-password-42')
  await page.getByRole('button', { name: 'Show password', exact: true }).click()
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Hide password', exact: true }).click()
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('sample-password-42')
  await page.getByRole('button', { name: 'Create one', exact: true }).click()
  await page.getByLabel('Password', { exact: true }).fill('sample-password-42')
  await page.getByLabel('Confirm Password', { exact: true }).fill('different')
  await expect(page.getByLabel('Confirm Password', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await page.getByRole('button', { name: 'Show passwords', exact: true }).click()
  await expect(page.getByLabel('Confirm Password', { exact: true })).toHaveAttribute('type', 'text')
  await page.getByLabel('Confirm Password', { exact: true }).fill('sample-password-42')
  await expect(page.getByLabel('Confirm Password', { exact: true })).toHaveAttribute('aria-invalid', 'false')
  await expect(page.getByRole('button', { name: 'Create account', exact: true })).toBeEnabled()
})


test('tables use quiet rows, aligned amounts, and accessible text actions', async ({ page }, testInfo) => {
  await mockAccount(page, { planningData: true, manyAccounts: true })
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
    for (const path of ['accounts', 'categories', 'subscriptions', 'recurring-income']) {
      await page.goto(`/${path}`)
      if (path === 'categories') await page.locator('.categories-library > summary').click()
      const wrapper = page.locator('.table-wrapper')
      await expect(wrapper).toBeVisible()
      if (testInfo.project.name === 'desktop') {
        const table = wrapper.locator('table.data-table')
        await expect(table).toBeVisible()
        const rowColors = await table.locator('tbody tr').evaluateAll(rows => rows.map(row => getComputedStyle(row).backgroundColor))
        expect(rowColors.every(color => color === 'rgba(0, 0, 0, 0)'), `${path} rows have no zebra fills`).toBeTruthy()
        const actions = await table.locator('tbody td.col-actions').first().evaluate(cell => {
          const style = getComputedStyle(cell)
          return { position: style.position, background: style.backgroundColor, divider: style.borderLeftWidth }
        })
        expect(actions).toEqual({ position: 'static', background: 'rgba(0, 0, 0, 0)', divider: '0px' })
        if (path === 'accounts') {
          await expect(table.locator('tbody tr')).toHaveCount(9)
          await expect(table.getByRole('cell', { name: '—', exact: true })).toHaveCount(5)
          const alignment = await table.locator('tbody td.col-balance').first().evaluate(cell => getComputedStyle(cell).textAlign)
          expect(alignment).toBe('right')
          await page.getByRole('button', { name: 'Sort by Balance', exact: true }).click()
          await expect(table.locator('th.col-balance')).toHaveAttribute('aria-sort', 'ascending')
        }
      } else {
        await wrapper.locator('.table-mobile-summary-button').first().click()
        const details = wrapper.locator('.table-mobile-details').first()
        const detailStyles = await details.evaluate(container => [container, ...container.querySelectorAll('.table-mobile-field')].map(element => {
          const style = getComputedStyle(element)
          return { background: style.backgroundColor, radius: style.borderRadius, border: style.borderWidth }
        }))
        for (const style of detailStyles) {
          expect(style).toEqual({ background: 'rgba(0, 0, 0, 0)', radius: '0px', border: '0px' })
        }
        const labelCase = await details.locator('.table-mobile-field-label').first().evaluate(label => getComputedStyle(label).textTransform)
        expect(labelCase).toBe('none')
      }
      const actionStyles = await wrapper.locator('button.edit-btn, button.delete-btn').evaluateAll(buttons => buttons.filter(button => button.checkVisibility()).map(button => {
        const style = getComputedStyle(button)
        return { background: style.backgroundColor, border: style.borderWidth, height: button.getBoundingClientRect().height, text: style.webkitTextFillColor, color: style.color }
      }))
      expect(actionStyles.length).toBeGreaterThan(0)
      for (const style of actionStyles) {
        expect(style.background).toBe('rgba(0, 0, 0, 0)')
        expect(style.border).toBe('0px')
        expect(style.height).toBeGreaterThanOrEqual(48)
        expect(style.text).toBe(style.color)
      }
    }
  }
  await page.goto('/accounts')
  const search = page.getByRole('searchbox', { name: 'Search table' })
  await search.fill('Reserve fund')
  await expect(page.getByText('Reserve fund', { exact: true })).toBeVisible()
  await expect(page.getByText('Everyday bank', { exact: true })).toHaveCount(0)
  if (testInfo.project.name === 'phone') {
    await page.setViewportSize({ width: 320, height: 740 })
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
    await page.locator('.table-mobile-summary-button').click()
    await expect(page.locator('.table-mobile-details')).toContainText('Set aside for unexpected expenses')
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBeFalsy()
    const overflowingFields = await page.locator('.table-mobile-field').evaluateAll(fields => fields.filter(field => field.scrollWidth > field.clientWidth).length)
    expect(overflowingFields).toBe(0)
  }
  await page.getByRole('button', { name: 'Edit', exact: true }).press('Enter')
  await expect(page.getByRole('dialog').getByLabel('Account Name')).toHaveValue('Reserve fund')
  await page.getByRole('button', { name: 'Close sheet' }).click()
  await expect(page.locator('.table-bulk-toolbar')).toHaveCount(0)
  await search.fill('')
  await expect(page.locator('.table-result-count')).toHaveText('9 records')
})


test('settings choices and privacy switches persist and fit enlarged text', async ({ page }) => {
  await mockAccount(page)
  await page.goto('/settings')
  const summary = page.locator('.settings-preferences:not(.settings-data) > summary')
  await summary.click()
  await expect(page.locator('.settings-preferences-body .layout-preference-card')).toHaveCount(0)
  const theme = page.getByRole('radiogroup', { name: 'Theme', exact: true })
  await theme.getByRole('radio', { name: 'Dark', exact: true }).check()
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark')
  await page.getByLabel('Home layout', { exact: true }).selectOption('growth')
  await expect(page.locator('#settings-layout-hint')).toContainText('net worth')
  const privacy = page.getByRole('switch', { name: 'Privacy shield', exact: true })
  await expect(privacy).toBeChecked()
  await privacy.uncheck()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('pitaka.privacyShield'))).toBe('off')
  await page.reload()
  await summary.click()
  await expect(theme.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked()
  await expect(page.getByLabel('Home layout', { exact: true })).toHaveValue('growth')
  await expect(privacy).not.toBeChecked()
  await privacy.focus()
  await page.keyboard.press('Space')
  await expect(privacy).toBeChecked()
  await theme.getByRole('radio', { name: 'Dark', exact: true }).focus()
  await page.keyboard.press('ArrowLeft')
  await expect(theme.getByRole('radio', { name: 'Light', exact: true })).toBeChecked()
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'light')
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export diagnostics', exact: true }).click()
  const download = await downloadEvent
  expect(download.suggestedFilename()).toMatch(/^pitaka-diagnostics-\d{4}-\d{2}-\d{2}\.json$/)
  await page.setViewportSize({ width: 320, height: 740 })
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBeFalsy()
  await expect(page.getByLabel('Home layout', { exact: true })).toBeVisible()
  await expect(privacy).toBeEnabled()
})

test('notification settings handle permission, disabling, denial, and errors', async ({ page }) => {
  await page.addInitScript(() => {
    window.__notificationPermission = 'default'
    window.__notificationRequests = 0
    localStorage.setItem('pitaka.notifications', 'on')
    class TestNotification {
      static get permission() { return window.__notificationPermission }
      static requestPermission() {
        window.__notificationRequests++
        return new Promise((resolve, reject) => {
          window.__finishNotificationPermission = (permission) => { window.__notificationPermission = permission; resolve(permission) }
          window.__rejectNotificationPermission = () => reject(new Error('Permission unavailable'))
        })
      }
    }
    Object.defineProperty(window, 'Notification', { configurable: true, value: TestNotification })
  })
  await mockAccount(page)
  await page.goto('/settings')
  const summary = page.locator('.settings-preferences:not(.settings-data) > summary')
  await summary.click()
  const alerts = page.getByRole('switch', { name: 'Budget & debt alerts', exact: true })
  await alerts.click()
  await expect(alerts).toBeDisabled()
  await page.evaluate(() => window.__finishNotificationPermission('granted'))
  await expect(alerts).toBeEnabled()
  await expect(alerts).toBeChecked()
  expect(await page.evaluate(() => localStorage.getItem('pitaka.notifications'))).toBe('on')
  await alerts.uncheck()
  expect(await page.evaluate(() => window.__notificationRequests)).toBe(1)
  expect(await page.evaluate(() => localStorage.getItem('pitaka.notifications'))).toBe('off')
  await page.evaluate(() => { window.__notificationPermission = 'default' })
  await alerts.click()
  await page.evaluate(() => window.__finishNotificationPermission('denied'))
  await expect(alerts).toBeDisabled()
  await expect(alerts).not.toBeChecked()
  await expect(page.locator('#settings-alert-hint')).toContainText('Notifications are blocked')
  await page.reload()
  await summary.click()
  await alerts.click()
  await page.evaluate(() => window.__rejectNotificationPermission())
  await expect(alerts).toBeEnabled()
  await expect(alerts).not.toBeChecked()
  await expect(page.locator('#settings-alert-hint')).toContainText('Could not change notifications')
})

test('unsupported notification settings explain why the switch is unavailable', async ({ page }) => {
  await page.addInitScript(() => { delete window.Notification })
  await mockAccount(page)
  await page.goto('/settings')
  await page.locator('.settings-preferences:not(.settings-data) > summary').click()
  await expect(page.getByRole('switch', { name: 'Budget & debt alerts', exact: true })).toBeDisabled()
  await expect(page.locator('#settings-alert-hint')).toContainText('Alerts stay visible inside Pitaka')
})


for (const width of [320, 360, 412])
  test(`mobile layout keeps titles, summaries, and navigation usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
    await mockAccount(page, { manyAccounts: true, planningData: true })
    for (const path of ['dashboard', 'transactions', 'accounts', 'plan', 'settings']) {
      await page.goto(`/${path}`)
      await expect(page.locator('.mobile-content')).toBeVisible()
      const title = page.locator('.mobile-header h1')
      const titleSize = await title.evaluate(element => ({ height: element.getBoundingClientRect().height, line: parseFloat(getComputedStyle(element).lineHeight) }))
      expect(titleSize.height, `${path} title stays on one line`).toBeLessThanOrEqual(titleSize.line + 1)
      const period = page.getByRole('group', { name: 'Reporting period', exact: true })
      if (await period.count()) {
        const headingBox = await title.boundingBox()
        const periodBox = await period.boundingBox()
        expect(periodBox.y).toBeGreaterThanOrEqual(headingBox.y + headingBox.height)
      }
      const quickActions = page.locator('.quick-actions button')
      if (await quickActions.count()) {
        const buttons = await quickActions.evaluateAll(elements => elements.map(element => ({ y: element.getBoundingClientRect().top, height: element.getBoundingClientRect().height, icon: element.querySelector('svg').getBoundingClientRect().width })))
        expect(new Set(buttons.map(button => button.y)).size, 'Quick actions fit on one row').toBe(1)
        expect(buttons.every(button => button.height >= 48 && button.icon >= 16)).toBeTruthy()
      }
      if (path === 'dashboard' || path === 'transactions') {
        if (path === 'dashboard') {
          await page.evaluate(async () => {
            const { expenseService } = await import('/src/services/firebaseService.js')
            await expenseService.updateExpense('food', { amount: 65000 })
          })
          await expect(page.locator('.overview-metric--net > strong')).toContainText('-')
        }
        const stats = await page.locator('.workspace-stat').evaluateAll(elements => elements.map(element => {
          const value = element.querySelector('strong')
          return { top: element.getBoundingClientRect().top, valueHeight: value.getBoundingClientRect().height, valueLine: parseFloat(getComputedStyle(value).lineHeight) }
        }))
        expect(stats[0].top, 'Income and expenses share a row').toBe(stats[1].top)
        expect(stats.every(stat => stat.valueHeight <= stat.valueLine + 1), 'Amounts remain readable on one line').toBeTruthy()
      }
      const navigation = page.locator('.bottom-nav')
      const navFrame = await navigation.evaluate(element => {
        const style = getComputedStyle(element)
        const probe = document.createElement('span')
        probe.style.backgroundColor = 'var(--card-background)'
        element.append(probe)
        const surface = getComputedStyle(probe).backgroundColor
        probe.remove()
        const box = element.getBoundingClientRect()
        return { left: box.left, right: box.right, bottom: box.bottom, background: style.backgroundColor, surface }
      })
      expect(navFrame.left).toBe(0)
      expect(navFrame.right).toBe(width)
      expect(navFrame.bottom).toBe(800)
      expect(navFrame.background, 'Navigation has an opaque surface').toBe(navFrame.surface)
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
      const clearance = await page.evaluate(() => ({
        contentBottom: document.querySelector('.mobile-content').lastElementChild.getBoundingClientRect().bottom,
        navTop: document.querySelector('.bottom-nav').getBoundingClientRect().top
      }))
      expect(clearance.contentBottom, `${path} last section clears navigation`).toBeLessThanOrEqual(clearance.navTop - 12)
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), path).toBeFalsy()
    }
    await page.goto('/dashboard')
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    const enlarged = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      contentBottom: document.querySelector('.mobile-content').lastElementChild.getBoundingClientRect().bottom,
      navTop: document.querySelector('.bottom-nav').getBoundingClientRect().top
    }))
    expect(enlarged.overflow).toBeFalsy()
    expect(enlarged.contentBottom).toBeLessThanOrEqual(enlarged.navTop - 12)
  })

test('mobile expense entry stays usable in a short viewport', async ({ page }) => {
  await mockAccount(page)
  await page.setViewportSize({ width: 360, height: 640 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/dashboard')
  await page.locator('.quick-actions button').first().click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('.form-disclosure > summary').click()
  await dialog.getByLabel('Notes', { exact: true }).fill('Small-screen note')
  await page.setViewportSize({ width: 360, height: 360 })
  const save = dialog.getByRole('button', { name: 'Add expense', exact: true })
  const close = page.getByRole('button', { name: 'Close sheet', exact: true })
  for (const control of [save, close]) {
    await expect.poll(async () => {
      const box = await control.boundingBox()
      return box.y >= 0 && box.y + box.height <= 360
    }).toBeTruthy()
    const box = await control.boundingBox()
    expect(box.height).toBeGreaterThanOrEqual(48)
  }
  await expect.poll(async () => {
    const noteBox = await dialog.getByLabel('Notes', { exact: true }).boundingBox()
    const saveBox = await save.boundingBox()
    return noteBox.y + noteBox.height <= saveBox.y
  }).toBeTruthy()
  await close.click()
  await expect(dialog).toHaveCount(0)
  await page.setViewportSize({ width: 740, height: 360 })
  await nav(page).getByRole('button', { name: 'Activity', exact: true }).click()
  await expect(page.locator('.mobile-header h1')).toHaveText('Activity')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBeFalsy()
})


test('mobile sheets follow the visible area when only the keyboard viewport shrinks', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    const viewport = Object.assign(new EventTarget(), { height: 640, offsetTop: 0 })
    window.__visibleViewport = viewport
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport })
  })
  await mockAccount(page)
  await page.goto('/dashboard')
  await page.locator('.quick-actions button').first().click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('.form-disclosure > summary').click()
  const notes = dialog.getByLabel('Notes', { exact: true })
  await notes.fill('Keep this field above the keyboard')
  await page.evaluate(() => {
    window.__visibleViewport.height = 360
    window.__visibleViewport.dispatchEvent(new Event('resize'))
  })
  const save = dialog.getByRole('button', { name: 'Add expense', exact: true })
  await expect.poll(async () => {
    const sheet = await dialog.boundingBox()
    const note = await notes.boundingBox()
    const action = await save.boundingBox()
    return sheet.y >= 0 && sheet.y + sheet.height <= 360 && note.y >= sheet.y && note.y + note.height <= action.y
  }).toBeTruthy()
  await expect(notes).toBeFocused()
  await expect(notes).toHaveValue('Keep this field above the keyboard')
  await page.getByRole('button', { name: 'Close sheet', exact: true }).click()
  await expect(dialog).toHaveCount(0)
})
