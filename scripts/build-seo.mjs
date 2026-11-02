import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createServer } from 'vite'

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const server = await createServer({ cacheDir: '.cache/vite-ssr', optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom', mode: 'production' })
try {
  const { pages, renderPage, PRIVATE_PATHS, absoluteUrl, FAQS, SITE_UPDATED, BLOG_POSTS } = await server.ssrLoadModule('/src/entry-server.jsx')
  const template = await readFile('dist/index.html', 'utf8')
  const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8'))
  const css = new Set()
  const visited = new Set()
  function collectCss(key) {
    if (visited.has(key)) return
    visited.add(key)
    const chunk = manifest[key]
    chunk?.css?.forEach(file => css.add(file))
    chunk?.imports?.forEach(collectCss)
  }
  Object.keys(manifest).filter(key => /(?:index.html|components\/(Landing|Blog|PublicPage|AccountDeletionPage|Auth|ContactForm)\.jsx)$/.test(key)).forEach(collectCss)
  const styles = [...css].filter(file => !template.includes(`/${file}`)).map(file => `<link rel="stylesheet" href="/${file}">`).join('\n')
  function documentFor(metadata, content = '', schema) {
    const url = absoluteUrl(metadata.path)
    const head = `<title>${escape(metadata.title)}</title>
<meta name="description" content="${escape(metadata.description)}">
<meta name="robots" content="${escape(metadata.robots)}">
<link rel="canonical" href="${escape(url)}">
<meta property="og:type" content="${metadata.type || 'website'}">
<meta property="og:title" content="${escape(metadata.title)}">
<meta property="og:description" content="${escape(metadata.description)}">
<meta property="og:url" content="${escape(url)}">
<meta property="og:image" content="${absoluteUrl('/pitaka-social-share.png')}">
<meta property="og:image:alt" content="Pitaka personal finance app">
<meta property="og:site_name" content="Pitaka">
<meta property="og:locale" content="en_PH">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(metadata.title)}">
<meta name="twitter:description" content="${escape(metadata.description)}">
<meta name="twitter:image" content="${absoluteUrl('/pitaka-social-share.png')}">
${schema ? `<script id="pitaka-page-schema" type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>` : ''}`
    return template.replace(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->/, head)
      .replace('</head>', `${styles}\n</head>`)
      .replace('<div id="root"></div>', `<div id="root">${content}</div>`)
  }
  for (const metadata of pages) {
    const { html, schema } = renderPage(metadata)
    const file = metadata.path === '/' ? 'dist/index.html' : `dist${metadata.path}.html`
    await mkdir(file.slice(0, file.lastIndexOf('/')), { recursive: true })
    await writeFile(file, documentFor(metadata, html, schema))
  }
  await writeFile('dist/app-shell.html', documentFor({ title: 'Sign In to Pitaka', description: 'Access your Pitaka account and finance records.', path: '/login', robots: 'noindex, follow' }))
  const missing = { title: 'Page Not Found | Pitaka', description: 'This Pitaka page could not be found.', path: '/404', robots: 'noindex, follow' }
  await writeFile('dist/404.html', documentFor(missing, renderPage(missing).html))
  const privacyPolicy = (await readFile('public/privacy-policy.html', 'utf8')).replace(/rel="canonical" href="[^"]+"/, `rel="canonical" href="${escape(absoluteUrl('/privacy-policy.html'))}"`)
  await writeFile('dist/privacy-policy.html', privacyPolicy)

  const urls = [...pages.map(page => ({ path: page.path, updated: BLOG_POSTS.find(post => page.path === `/blogs/${post.slug}`)?.updated })), { path: '/privacy-policy.html' }]
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(item => `  <url><loc>${escape(absoluteUrl(item.path))}</loc>${item.updated ? `<lastmod>${item.updated}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`
  const rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Pitaka Blog</title><link>${absoluteUrl('/blogs')}</link><description>Practical budgeting and personal finance guides from Pitaka.</description><language>en</language><atom:link href="${absoluteUrl('/rss.xml')}" rel="self" type="application/rss+xml"/>${BLOG_POSTS.map(post => `<item><title>${escape(post.title)}</title><link>${absoluteUrl(`/blogs/${post.slug}`)}</link><guid isPermaLink="true">${absoluteUrl(`/blogs/${post.slug}`)}</guid><pubDate>${new Date(post.date).toUTCString()}</pubDate><description>${escape(post.excerpt)}</description></item>`).join('\n')}</channel></rss>\n`
  const llms = `# Pitaka\n\n> A manual personal finance and budget tracker for individuals and households, with Philippine peso support.\n\n${FAQS.map(item => `## ${item.question}\n${item.answer}\n`).join('\n')}\n## Public sources\n${pages.map(page => `- [${page.title}](${absoluteUrl(page.path)}): ${page.description}`).join('\n')}\n- [Privacy policy](${absoluteUrl('/privacy-policy.html')})\n\nProduct information reviewed ${SITE_UPDATED}. These files are optional summaries; the linked pages are the sources.\n`
  const resources = { 'sitemap.xml': sitemap, 'rss.xml': rss, 'robots.txt': `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl('/sitemap.xml')}\n`, 'llms.txt': llms, 'llms-full.txt': `${llms}\n## Finance guides\n\n${BLOG_POSTS.map(post => `### ${post.title}\nSource: ${absoluteUrl(`/blogs/${post.slug}`)}\nPublished: ${post.date}${post.updated ? `; updated: ${post.updated}` : ''}\n${post.excerpt}\n${post.content}\n${post.sources?.map(source => `${source.title}: ${source.url}`).join('\n') || ''}`).join('\n\n')}` }
  for (const [name, contents] of Object.entries(resources)) {
    await writeFile(`public/${name}`, contents)
    await writeFile(`dist/${name}`, contents)
  }
  // Keep native builds as app shells; web hosting alone serves the prerendered pages.
  console.log(`Prerendered ${pages.length} public pages; private routes use a noindex app shell (${PRIVATE_PATHS.length} routes).`)
} finally {
  await server.close()
}
