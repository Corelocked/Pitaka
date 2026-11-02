import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import vm from 'node:vm'
import { PUBLIC_PAGES, PRIVATE_PATHS } from '../src/content/site.mjs'
import { BLOG_POSTS } from '../src/content/blogPosts.mjs'

const config = JSON.parse(await readFile('vercel.json', 'utf8'))
const sitemap = await readFile('dist/sitemap.xml', 'utf8')
const rss = await readFile('dist/rss.xml', 'utf8')
const paths = [...Object.keys(PUBLIC_PAGES), '/blogs', ...BLOG_POSTS.map(post => `/blogs/${post.slug}`)]
const titles = new Set()
const descriptions = new Set()
const escapeText = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' })[char])
let origin
for (const path of paths) {
  const html = await readFile(path === '/' ? 'dist/index.html' : `dist${path}.html`, 'utf8')
  const title = html.match(/<title>(.*?)<\/title>/)?.[1]
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1]
  assert.ok(title && description, `${path}: missing metadata`)
  assert.ok(!titles.has(title), `${path}: duplicate title`)
  assert.ok(!descriptions.has(description), `${path}: duplicate description`)
  titles.add(title); descriptions.add(description)
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1, `${path}: canonical count`)
  const canonical = new URL(html.match(/rel="canonical" href="([^"]+)"/)[1])
  origin ??= canonical.origin
  assert.equal(canonical.origin, origin)
  assert.equal(canonical.pathname, path)
  assert.match(html, /<meta name="robots" content="index, follow/)
  assert.ok(!html.includes('hreflang=') && !html.includes('name="keywords"'), `${path}: unsupported legacy metadata`)
  const body = html.split('<div id="root">')[1]?.split('<noscript>')[0]
  assert.ok(body?.includes('<h1') && body.length > 1000, `${path}: empty app shell`)
  assert.equal((html.match(/application\/ld\+json/g) || []).length, 1)
  const schema = JSON.parse(html.match(/<script id="pitaka-page-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])
  assert.ok(schema['@graph'].some(item => item.url === canonical.href), `${path}: schema URL differs`)
  const faq = schema['@graph'].find(item => item['@type'] === 'FAQPage')
  if (faq) for (const item of faq.mainEntity) {
    assert.ok(body.includes(escapeText(item.name)), `${path}: hidden FAQ question`)
    assert.ok(body.includes(escapeText(item.acceptedAnswer.text)), `${path}: hidden FAQ answer`)
  }
  for (const match of html.matchAll(/href="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
    const target = match[1]
    if (paths.includes(target) || PRIVATE_PATHS.includes(target) || target === '/') continue
    await access(`dist${target}`).catch(() => assert.fail(`${path}: broken internal link ${target}`))
  }
  assert.ok(sitemap.includes(`<loc>${canonical.href}</loc>`), `${path}: missing sitemap entry`)
  if (path !== '/') {
    assert.ok(config.rewrites.some(rule => rule.source === path && rule.destination === `${path}.html`), `${path}: missing hosting route`)
    assert.ok(config.redirects.some(rule => rule.source === `${path}.html` && rule.destination === path), `${path}: missing canonical redirect`)
  }
}
for (const path of PRIVATE_PATHS) {
  assert.ok(!sitemap.includes(`<loc>${origin}${path}</loc>`), `${path}: private sitemap entry`)
  assert.ok(config.rewrites.some(rule => rule.source === path && rule.destination === '/app-shell.html'), `${path}: wrong shell`)
}
for (const post of BLOG_POSTS) assert.ok(rss.includes(`${origin}/blogs/${post.slug}</link>`))
for (const file of ['app-shell.html', '404.html']) {
  const html = await readFile(`dist/${file}`, 'utf8')
  assert.match(html, /name="robots" content="noindex, follow"/)
  assert.ok(!html.includes('application/ld+json'))
}
assert.ok(!config.routes && !config.rewrites.some(rule => rule.source.includes('.*') || rule.source === '/:path*'), 'Catch-all would create soft 404s or intercept APIs')
assert.equal(new Set(paths).size, paths.length, 'Duplicate public route')
// Navigating to one public page must not replace every offline page with its HTML.
const handlers = {}
const cachedRequests = []
let fetchOk = true
let offline = false
const cacheLookups = []
const worker = {
  self: { location: { hostname: 'example.test', origin: 'https://example.test' }, addEventListener: (name, callback) => { handlers[name] = callback }, skipWaiting() {} },
  URL,
  caches: { open: async () => ({ addAll: async () => {}, put: async (request) => { cachedRequests.push(request.url) } }), match: async request => { const key = typeof request === 'string' ? request : request.url; cacheLookups.push(key); return key === '/' ? 'offline-home-shell' : undefined } },
  fetch: async () => { if (offline) throw new Error('offline'); return { ok: fetchOk, clone: () => ({}) } }
}
vm.runInNewContext(await readFile('public/sw.js', 'utf8'), worker)
let response
const eventFor = path => ({ request: { url: `https://example.test${path}`, method: 'GET', mode: 'navigate' }, respondWith: promise => { response = promise }, waitUntil: promise => { response = promise } })
handlers.install(eventFor('/'))
await response
for (const path of ['/features', '/blogs']) {
  handlers.fetch(eventFor(path))
  await response
}
assert.deepEqual(cachedRequests, ['https://example.test/features', 'https://example.test/blogs'])
fetchOk = false
handlers.fetch(eventFor('/missing'))
await response
assert.equal(cachedRequests.length, 2, '404 pages must not be cached')
response = undefined
handlers.fetch(eventFor('/api/billing/status'))
assert.equal(response, undefined, 'Do not cache API responses')
offline = true
handlers.fetch(eventFor('/features'))
assert.equal(await response, 'offline-home-shell')
assert.deepEqual(cacheLookups, ['https://example.test/features', '/'], 'Fallback must use the root page, not a redirecting HTML alias')
console.log(`SEO checks passed: ${paths.length} unique pages, canonical URLs, visible structured data, internal links, feeds, private routes, and 404 shell.`)
