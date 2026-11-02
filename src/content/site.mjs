const configuredOrigin = import.meta.env?.VITE_SITE_URL || 'https://pitaka-sigma.vercel.app'
export const SITE_ORIGIN = new URL(configuredOrigin).origin
export const SITE_UPDATED = '2026-11-02'
export const WEB_PRO_PRICE_AMOUNT = Number(import.meta.env?.VITE_PITAKA_PRO_PRICE_AMOUNT || 50000)
export const WEB_PRO_PRICE_CURRENCY = String(import.meta.env?.VITE_PITAKA_PRO_PRICE_CURRENCY || 'PHP').toUpperCase()
export const INDEX_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
export const NOINDEX_ROBOTS = 'noindex, follow'
export const SITE_DESCRIPTION = 'Track expenses, income, accounts, budgets, and savings goals with Pitaka. Free PHP and USD tracking on the web, with an optional one-time Pro upgrade.'
export const PRIVATE_PATHS = ['/login', '/signup', '/dashboard', '/plan', '/transactions', '/accounts', '/wealth', '/savings', '/investments', '/categories', '/subscriptions', '/recurring-income', '/settings', '/pro', '/android-app']

export const PUBLIC_PAGES = {
  '/': { title: 'Pitaka — Budget & Expense Tracker for the Philippines', heading: 'Budget with more control and less noise.', description: SITE_DESCRIPTION },
  '/features': { title: 'Budgeting, Expense & Savings Features | Pitaka', heading: 'One workspace for your everyday money.', description: 'Explore Pitaka’s manual expense tracking, category budgets, accounts, savings goals, reports, and optional Pro tools for recurring income and investments.' },
  '/pricing': { title: 'Free Budget Tracker & One-Time Pro Upgrade | Pitaka', heading: 'Start free. Upgrade once for Pro.', description: 'Compare Pitaka Basic and Pro. Track PHP and USD for free, or unlock recurring income, subscriptions, investments, and more currencies with a one-time upgrade.' },
  '/about': { title: 'About Pitaka — A Personal Finance Tracker', heading: 'A clearer record of where your money goes.', description: 'Learn what Pitaka does, who it is for, and how its manual finance tracking works. Built for individuals and households, with Philippine peso support.' },
  '/contact': { title: 'Contact Pitaka — Product & Account Support', heading: 'Get help with Pitaka.', description: 'Contact Pitaka about account access, data requests, bugs, or product feedback. Send your account email and a description; never send passwords or bank credentials.' },
  '/help': { title: 'Pitaka Help — Budgeting App Questions & Answers', heading: 'Answers before you start.', description: 'Find answers about Pitaka’s free plan, Pro purchase, supported currencies, manual expense tracking, offline access, Android testing, and account deletion.' },
  '/privacy': { title: 'Privacy & Data Controls | Pitaka', heading: 'Your financial records, under your control.', description: 'Understand Pitaka’s account privacy, manual finance records, data exports, deletion options, and service providers. Read the full privacy policy.' },
  '/delete-account': { title: 'Delete Your Pitaka Account or Selected Data', heading: 'Delete or remove your Pitaka data', description: 'Delete selected finance records or permanently remove your Pitaka account and associated cloud data. Review deletion steps, retained data, and support options.' }
}

export const FAQS = [
  { question: 'What is Pitaka?', answer: 'Pitaka is a personal finance and budget tracker for individuals and households. You manually record income, expenses, accounts, transfers, budgets, and savings goals, then review them together.' },
  { question: 'Is Pitaka free?', answer: 'Yes. Pitaka Basic includes income and expense tracking, accounts, transfers, category budgets, savings goals, and PHP and USD support. Pro is an optional one-time upgrade.' },
  { question: 'What does Pitaka Pro include?', answer: 'Pro adds recurring income, subscription tracking, investment tracking, and the full supported currency list. Google Play handles purchases in the Android app; the website uses PayMongo. Check the displayed price before paying.' },
  { question: 'Does Pitaka connect to my bank, GCash, or Maya?', answer: 'No. You enter records yourself. You can label an account for a bank or e-wallet, but Pitaka does not access that account, transfer money, or automatically import its transactions.' },
  { question: 'Is Pitaka available on Android?', answer: 'The website is available now. The Android app is currently in Google Play closed testing for selected testers; it is not yet a public Play Store release.' },
  { question: 'Can I use Pitaka offline?', answer: 'After signing in and loading your records, cached data and queued changes can support offline use. Sign-in, purchases, and syncing changes across devices require an internet connection.' },
  { question: 'Can I export or delete my data?', answer: 'You can export records and download a backup from More. Delete individual records in their section, or use Delete account & data to remove your account and associated cloud finance records.' }
]

export function absoluteUrl(path = '/') {
  return new URL(path, `${SITE_ORIGIN}/`).href
}

export function pageMetadata(path = '/') {
  const normalized = path.replace(/\/+$/, '') || '/'
  const page = PUBLIC_PAGES[normalized]
  return page
    ? { ...page, path: normalized, robots: INDEX_ROBOTS, type: 'website' }
    : { title: 'Sign In to Pitaka', description: 'Sign in to securely access your Pitaka account and finance records.', path: normalized, robots: NOINDEX_ROBOTS, type: 'website' }
}

export function blogMetadata(post) {
  return post
    ? { title: `${post.title} | Pitaka Blog`, description: post.excerpt, path: `/blogs/${post.slug}`, robots: INDEX_ROBOTS, type: 'article' }
    : { title: 'Budgeting & Personal Finance Guides | Pitaka Blog', description: 'Practical guides to recording expenses, planning a budget, building savings, and organizing accounts. Published by Pitaka with sources and worked examples.', path: '/blogs', robots: INDEX_ROBOTS, type: 'website' }
}

export function pageSchema(metadata, { posts = [], post } = {}) {
  const url = absoluteUrl(metadata.path)
  const organization = { '@type': 'Organization', '@id': absoluteUrl('/#organization'), name: 'Pitaka', url: absoluteUrl(), logo: absoluteUrl('/pitaka-logo.png') }
  const graph = [organization, { '@type': 'WebSite', '@id': absoluteUrl('/#website'), name: 'Pitaka', url: absoluteUrl(), inLanguage: 'en', publisher: { '@id': organization['@id'] } }, {
    '@type': post ? 'WebPage' : metadata.path === '/blogs' ? 'CollectionPage' : metadata.path === '/about' ? 'AboutPage' : metadata.path === '/contact' ? 'ContactPage' : 'WebPage',
    '@id': `${url}#page`, url, name: metadata.title, description: metadata.description, inLanguage: 'en', isPartOf: { '@id': absoluteUrl('/#website') }
  }]
  if (post) {
    graph.push({ '@type': 'BlogPosting', '@id': `${url}#article`, headline: post.title, description: post.excerpt, url, mainEntityOfPage: { '@id': `${url}#page` }, datePublished: post.date, dateModified: post.updated || post.date, author: organization, publisher: organization, image: absoluteUrl('/pitaka-social-share.png'), articleSection: post.category, inLanguage: 'en' })
  } else if (metadata.path === '/blogs') {
    graph.push({ '@type': 'Blog', '@id': `${url}#blog`, name: 'Pitaka Blog', url, publisher: organization, blogPost: posts.map(item => ({ '@type': 'BlogPosting', headline: item.title, datePublished: item.date, url: absoluteUrl(`/blogs/${item.slug}`) })) })
  } else if (['/', '/features', '/pricing'].includes(metadata.path)) {
    const offers = [{ '@type': 'Offer', name: 'Pitaka Basic', price: '0', priceCurrency: 'PHP', description: 'Basic is free. Pro is a separate one-time purchase.' }]
    if (metadata.path === '/pricing') offers.push({ '@type': 'Offer', name: 'Pitaka Pro — website purchase', price: String(WEB_PRO_PRICE_AMOUNT / 100), priceCurrency: WEB_PRO_PRICE_CURRENCY, url, description: 'One-time website upgrade. Google Play regional prices can differ.' })
    graph.push({ '@type': 'SoftwareApplication', '@id': absoluteUrl('/#app'), name: 'Pitaka', applicationCategory: 'FinanceApplication', operatingSystem: 'Web, Android', url: absoluteUrl(), description: SITE_DESCRIPTION, image: absoluteUrl('/pitaka-social-share.png'), inLanguage: 'en', offers })
  }
  if (['/', '/help'].includes(metadata.path)) {
    graph.push({ '@type': 'FAQPage', '@id': `${url}#faq`, mainEntity: FAQS.map(item => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) })
  }
  if (metadata.path !== '/') {
    const items = [{ name: 'Home', item: absoluteUrl() }]
    if (post) items.push({ name: 'Blog', item: absoluteUrl('/blogs') })
    items.push({ name: post?.title || metadata.heading || metadata.title, item: url })
    graph.push({ '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, ...item })) })
  }
  return { '@context': 'https://schema.org', '@graph': graph }
}
