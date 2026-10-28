import { chromium } from '@playwright/test'
import { mkdir, copyFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mockAccount } from '../tests/ui/fixtures.mjs'

const output = fileURLToPath(new URL('../store-assets/google-play/', import.meta.url))
const baseURL = process.env.PITAKA_PREVIEW_URL || 'http://127.0.0.1:5173'

await mkdir(join(output, 'phone'), { recursive: true })
await mkdir(join(output, 'tablet-7-inch'), { recursive: true })
await mkdir(join(output, 'tablet-10-inch'), { recursive: true })

const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {})
})

try {
  const page = await browser.newPage({
    viewport: { width: 412, height: 824 },
    deviceScaleFactor: 1080 / 412,
    isMobile: true,
    hasTouch: true,
    locale: 'en-PH',
    timezoneId: 'Asia/Manila',
    colorScheme: 'dark'
  })
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await mockAccount(page, { pro: false })

  for (const [file, route] of [
    ['01-dashboard.jpg', '/dashboard'],
    ['02-transactions.jpg', '/transactions'],
    ['03-accounts.jpg', '/accounts'],
    ['04-savings-goals.jpg', '/wealth']
  ]) {
    await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' })
    await page.locator('.bottom-nav').waitFor()
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({
      path: join(output, 'phone', file),
      type: 'jpeg',
      quality: 94,
      animations: 'disabled'
    })
  }

  const tabletRoutes = [
    ['01-dashboard.jpg', '/dashboard'],
    ['02-transactions.jpg', '/transactions'],
    ['03-accounts.jpg', '/accounts'],
    ['04-savings-goals.jpg', '/wealth']
  ]
  for (const [folder, viewport, deviceScaleFactor] of [
    ['tablet-7-inch', { width: 600, height: 1067 }, 1.8],
    ['tablet-10-inch', { width: 1280, height: 720 }, 1.5]
  ]) {
    const tabletPage = await browser.newPage({
      viewport,
      deviceScaleFactor,
      locale: 'en-PH',
      timezoneId: 'Asia/Manila',
      colorScheme: 'dark'
    })
    await tabletPage.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
    await mockAccount(tabletPage, { pro: false })
    for (const [file, route] of tabletRoutes) {
      await tabletPage.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' })
      await tabletPage.waitForFunction(() => Boolean(window.__fixtureData))
      await tabletPage.evaluate(() => document.fonts.ready)
      await tabletPage.screenshot({
        path: join(output, folder, file),
        type: 'jpeg',
        quality: 94,
        animations: 'disabled'
      })
    }
    await tabletPage.close()
  }

  await page.setViewportSize({ width: 1024, height: 500 })
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box }
    html, body { margin: 0; width: 1024px; height: 500px; overflow: hidden; }
    body { position: relative; background: #10251f; color: #f7f7f2; font-family: Arial, sans-serif; }
    .glow { position:absolute; width:500px; height:500px; right:-90px; top:-170px; border-radius:50%; background:#244538; }
    .mark { position:absolute; left:70px; top:64px; width:8px; height:64px; border-radius:8px; background:#e2bd78; }
    .copy { position:absolute; left:104px; top:62px; width:460px; }
    .eyebrow { color:#e2bd78; font-size:16px; font-weight:700; letter-spacing:3px; }
    h1 { margin:20px 0 14px; font-size:54px; line-height:1.04; letter-spacing:-1.8px; }
    p { margin:0; color:#c6d1cb; font-size:22px; line-height:1.45; }
    .card { position:absolute; right:78px; top:66px; width:332px; height:368px; border:1px solid #4b6458; border-radius:28px; background:#192d25; padding:26px; box-shadow:0 24px 60px #08130f66; }
    .label { color:#bac8bf; font-size:15px; letter-spacing:1.4px; text-transform:uppercase; }
    .amount { margin:16px 0 8px; font-size:27px; font-weight:700; color:#f6f4ec; }
    .sub { color:#aabbb0; font-size:15px; }
    .bars { margin-top:28px; display:grid; gap:14px; }
    .bar { height:13px; border-radius:10px; background:#2a4035; overflow:hidden; }
    .bar i { display:block; height:100%; border-radius:10px; background:#d8b46e; }
    .bar:nth-child(2) i { background:#68aa7d; }
    .bar:nth-child(3) i { background:#cc7767; }
    .chips { display:flex; gap:10px; margin-top:28px; }
    .chip { flex:1; padding:13px 10px; border-radius:15px; background:#263a30; color:#d6e1d9; text-align:center; font-size:14px; }
  </style></head><body>
    <div class="glow"></div><div class="mark"></div>
    <div class="copy"><div class="eyebrow">PITAKA</div><h1>Everyday money,<br>in view.</h1><p>Track income, spending, budgets and savings in one place.</p></div>
    <div class="card"><div class="label">Your money, organized</div><div class="amount">Income · spending · savings</div><div class="sub">A simple monthly overview</div><div class="bars"><div class="bar"><i style="width:72%"></i></div><div class="bar"><i style="width:54%"></i></div><div class="bar"><i style="width:39%"></i></div></div><div class="chips"><div class="chip">Budgets</div><div class="chip">Goals</div></div></div>
  </body></html>`)
  await page.screenshot({
    path: join(output, 'feature-graphic.png'),
    type: 'png',
    scale: 'css',
    animations: 'disabled'
  })
  await copyFile(
    fileURLToPath(new URL('../public/favicon-512.png', import.meta.url)),
    join(output, 'app-icon-512.png')
  )
} finally {
  await browser.close()
}
