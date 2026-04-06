const DEFAULT_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
const DEFAULT_SITE_NAME = 'Pitaka'
const DEFAULT_LOCALE = 'en_US'
const DEFAULT_TWITTER_CARD = 'summary_large_image'
const DEFAULT_TWITTER_HANDLE = '@pitaka'
const DEFAULT_SITE_ORIGIN = 'https://pitaka-sigma.vercel.app'
const DEFAULT_KEYWORDS = [
  'personal finance app',
  'budget tracker',
  'expense tracker',
  'income tracker',
  'savings goals',
  'money management app',
  'financial planning app',
  'monthly budget planner',
  'cash flow tracker',
  'bill tracker',
  'subscription tracker',
  'investment tracker',
  'net worth tracker',
  'family budget app',
  'daily expense tracker',
  'budgeting app philippines',
  'wallet and account tracker',
  'personal finance dashboard',
  'budget app for web and mobile'
].join(', ')

const ensureMetaTag = ({ name, property }) => {
  if (typeof document === 'undefined') return null

  const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`
  let tag = document.head.querySelector(selector)

  if (!tag) {
    tag = document.createElement('meta')
    if (name) tag.setAttribute('name', name)
    if (property) tag.setAttribute('property', property)
    document.head.appendChild(tag)
  }

  return tag
}

const setMetaContent = (config, content) => {
  const tag = ensureMetaTag(config)
  if (!tag) return

  if (content === undefined || content === null || content === '') {
    tag.remove()
    return
  }

  tag.setAttribute('content', content)
}

const setCanonical = (url) => {
  if (typeof document === 'undefined') return

  let tag = document.head.querySelector('link[rel="canonical"]')
  if (!tag) {
    tag = document.createElement('link')
    tag.setAttribute('rel', 'canonical')
    document.head.appendChild(tag)
  }

  tag.setAttribute('href', url)
}

const normalizePath = (path = '/') => {
  const rawPath = String(path || '/').trim() || '/'
  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
  return normalizedPath === '/' ? '/' : normalizedPath.replace(/\/+$/, '')
}

const getSiteOrigin = () => {
  const envOrigin = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SITE_URL : null
  const rawOrigin = String(envOrigin || DEFAULT_SITE_ORIGIN).trim()

  try {
    return new URL(rawOrigin).origin
  } catch {
    return DEFAULT_SITE_ORIGIN
  }
}

const toAbsoluteUrl = (path = '/') => {
  const siteOrigin = getSiteOrigin()
  const normalizedPath = normalizePath(path)
  return new URL(normalizedPath, `${siteOrigin}/`).toString()
}

export const applySeo = ({
  title,
  description,
  path = '/',
  image = '/pitaka-social-share.png',
  imageAlt = 'Pitaka personal finance app',
  keywords = DEFAULT_KEYWORDS,
  robots = DEFAULT_ROBOTS,
  type = 'website',
  locale = DEFAULT_LOCALE,
  siteName = DEFAULT_SITE_NAME,
  author = DEFAULT_SITE_NAME,
  twitterCard = DEFAULT_TWITTER_CARD,
  twitterSite = DEFAULT_TWITTER_HANDLE,
  twitterCreator = DEFAULT_TWITTER_HANDLE
}) => {
  if (typeof document === 'undefined') return

  const canonicalUrl = toAbsoluteUrl(path)
  const imageUrl = toAbsoluteUrl(image)

  if (title) {
    document.title = title
  }

  setCanonical(canonicalUrl)

  setMetaContent({ name: 'description' }, description)
  setMetaContent({ name: 'keywords' }, keywords)
  setMetaContent({ name: 'robots' }, robots)
  setMetaContent({ name: 'author' }, author)
  setMetaContent({ name: 'application-name' }, siteName)

  setMetaContent({ property: 'og:type' }, type)
  setMetaContent({ property: 'og:title' }, title)
  setMetaContent({ property: 'og:description' }, description)
  setMetaContent({ property: 'og:url' }, canonicalUrl)
  setMetaContent({ property: 'og:image' }, imageUrl)
  setMetaContent({ property: 'og:image:alt' }, imageAlt)
  setMetaContent({ property: 'og:site_name' }, siteName)
  setMetaContent({ property: 'og:locale' }, locale)

  setMetaContent({ name: 'twitter:card' }, twitterCard)
  setMetaContent({ name: 'twitter:title' }, title)
  setMetaContent({ name: 'twitter:description' }, description)
  setMetaContent({ name: 'twitter:image' }, imageUrl)
  setMetaContent({ name: 'twitter:image:alt' }, imageAlt)
  setMetaContent({ name: 'twitter:site' }, twitterSite)
  setMetaContent({ name: 'twitter:creator' }, twitterCreator)
}

export const setArticleMetadata = ({ publishedTime, modifiedTime, section, tag, author = DEFAULT_SITE_NAME }) => {
  setMetaContent({ property: 'article:published_time' }, publishedTime)
  setMetaContent({ property: 'article:modified_time' }, modifiedTime)
  setMetaContent({ property: 'article:section' }, section)
  setMetaContent({ property: 'article:tag' }, tag)
  setMetaContent({ property: 'article:author' }, author)
}

export const setStructuredData = (id, payload) => {
  if (typeof document === 'undefined') return

  const scriptId = String(id || '').trim()
  if (!scriptId) return

  let script = document.getElementById(scriptId)
  if (!script) {
    script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = scriptId
    document.head.appendChild(script)
  }

  script.textContent = JSON.stringify(payload)
}

export const removeStructuredData = (id) => {
  if (typeof document === 'undefined') return
  const script = document.getElementById(id)
  if (script) script.remove()
}
