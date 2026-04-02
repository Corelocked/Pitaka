const DEFAULT_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'

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

const toAbsoluteUrl = (path = '/') => {
  const fallbackOrigin = 'https://pitaka-sigma.vercel.app'
  if (typeof window === 'undefined') {
    return `${fallbackOrigin}${path.startsWith('/') ? path : `/${path}`}`
  }

  return new URL(path, window.location.origin).toString()
}

export const applySeo = ({
  title,
  description,
  path = '/',
  image = '/pitaka-logo.png',
  keywords,
  robots = DEFAULT_ROBOTS,
  type = 'website'
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

  setMetaContent({ property: 'og:type' }, type)
  setMetaContent({ property: 'og:title' }, title)
  setMetaContent({ property: 'og:description' }, description)
  setMetaContent({ property: 'og:url' }, canonicalUrl)
  setMetaContent({ property: 'og:image' }, imageUrl)
  setMetaContent({ property: 'og:site_name' }, 'Pitaka')

  setMetaContent({ name: 'twitter:card' }, 'summary_large_image')
  setMetaContent({ name: 'twitter:title' }, title)
  setMetaContent({ name: 'twitter:description' }, description)
  setMetaContent({ name: 'twitter:image' }, imageUrl)
}

export const setArticleMetadata = ({ publishedTime, modifiedTime, section }) => {
  setMetaContent({ property: 'article:published_time' }, publishedTime)
  setMetaContent({ property: 'article:modified_time' }, modifiedTime)
  setMetaContent({ property: 'article:section' }, section)
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