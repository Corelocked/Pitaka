import { useState, useEffect } from 'react'
import './Blog.css'
import { BLOG_POSTS } from '../content/blogPosts.mjs'
import { blogMetadata, pageSchema } from '../content/site.mjs'
import { NotFound } from './PublicPage'
import { PublicFooter } from './PublicNavigation'
import {
  applySeo,
  removeStructuredData,
  setArticleMetadata,
  setStructuredData
} from '../utils/seo'

const BLOG_POSTS_BY_SLUG = BLOG_POSTS.reduce((accumulator, post) => {
  accumulator[post.slug] = post
  return accumulator
}, {})

const getPostFromSlug = (slug) => BLOG_POSTS_BY_SLUG[slug] || null

const getCurrentPath = () => {
  if (typeof window === 'undefined') return '/'
  return (window.location.pathname || '/').replace(/\/+$/, '') || '/'
}

const BLOG_ROUTE_BASES = ['/blog', '/blogs']

const getBlogPathBase = (path = getCurrentPath()) => {
  const match = BLOG_ROUTE_BASES.find((base) => path === base || path.startsWith(`${base}/`))
  return match || '/blogs'
}

const getSlugFromPath = () => {
  const currentPath = getCurrentPath()
  const pathBase = getBlogPathBase(currentPath)
  if (!currentPath.startsWith(`${pathBase}/`)) return null
  const rawSlug = currentPath.slice(`${pathBase}/`.length)
  try { return decodeURIComponent(rawSlug) } catch { return rawSlug }
}

const isBlogsPathRoute = () => {
  const currentPath = getCurrentPath()
  return BLOG_ROUTE_BASES.some((base) => currentPath === base || currentPath.startsWith(`${base}/`))
}

const getInitialBlogSlug = () => {
  if (typeof window === 'undefined') return null

  const pathSlug = getSlugFromPath()
  if (pathSlug) {
    return pathSlug
  }

  const params = new URLSearchParams(window.location.search)
  const querySlug = params.get('post') || params.get('slug')
  if (querySlug && getPostFromSlug(querySlug)) {
    return querySlug
  }

  const hash = window.location.hash.replace(/^#/, '')
  if (hash.startsWith('blog/')) {
    const hashSlug = hash.slice('blog/'.length)
    if (getPostFromSlug(hashSlug)) {
      return hashSlug
    }
  }

  return null
}

const normalizeBlogText = (value) => String(value || '').trim()

const stripMarkdownBold = (value) => String(value || '').replace(/\*\*/g, '')

const renderBlogContent = (content) => {
  const lines = String(content || '')
    .split('\n')
    .map((line) => normalizeBlogText(line))

  const elements = []
  let listItems = []
  let listType = null

  const flushList = (keyPrefix) => {
    if (listItems.length === 0) return

    const rendered = listItems.map((item, idx) => <li key={`${keyPrefix}-${idx}`}>{item}</li>)
    elements.push(listType === 'ordered'
      ? <ol key={`${keyPrefix}-ol`}>{rendered}</ol>
      : <ul key={`${keyPrefix}-ul`}>{rendered}</ul>)

    listItems = []
    listType = null
  }

  lines.forEach((line, index) => {
    if (!line) {
      flushList(index)
      return
    }

    if (/^\*\*[^*]+\*\*$/.test(line)) {
      flushList(index)
      elements.push(<h2 key={`h-${index}`}>{stripMarkdownBold(line)}</h2>)
      return
    }

    if (/^\d+\.\s+/.test(line)) {
      const item = stripMarkdownBold(line.replace(/^\d+\.\s+/, ''))
      if (listType !== 'ordered') {
        flushList(index)
        listType = 'ordered'
      }
      listItems.push(item)
      return
    }

    if (/^-\s+/.test(line)) {
      const item = stripMarkdownBold(line.replace(/^-\s+/, ''))
      if (listType !== 'unordered') {
        flushList(index)
        listType = 'unordered'
      }
      listItems.push(item)
      return
    }

    flushList(index)
    elements.push(<p key={`p-${index}`}>{stripMarkdownBold(line)}</p>)
  })

  flushList('final')
  return elements
}

export default function Blog({ onBackToLanding, initialSlug }) {
  const [selectedSlug, setSelectedSlug] = useState(() => initialSlug ?? getInitialBlogSlug())

  const featuredPost = BLOG_POSTS.find(p => p.featured)
  const otherPosts = BLOG_POSTS.filter(p => !p.featured)
  const selectedPost = selectedSlug ? getPostFromSlug(selectedSlug) : null

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const usesBlogsPathRoute = isBlogsPathRoute()
    const pathBase = getBlogPathBase()

    if (!selectedSlug) {
      if (usesBlogsPathRoute) {
        window.history.replaceState(null, '', pathBase)
      } else {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
      }
      return undefined
    }

    const nextUrl = usesBlogsPathRoute
      ? `${pathBase}/${selectedSlug}`
      : `${window.location.pathname}${window.location.search}#blog/${selectedSlug}`
    window.history.replaceState(null, '', nextUrl)
  }, [selectedSlug])

  useEffect(() => {
    const previousTheme = document.body.dataset.theme
    const appearance = window.matchMedia('(prefers-color-scheme: dark)')
    const applySystemAppearance = () => {
      const theme = appearance.matches ? 'dark' : 'light'
      document.body.dataset.theme = theme
      document.documentElement.style.colorScheme = theme
    }

    applySystemAppearance()
    appearance.addEventListener('change', applySystemAppearance)

    return () => {
      appearance.removeEventListener('change', applySystemAppearance)
      if (previousTheme) {
        document.body.dataset.theme = previousTheme
        document.documentElement.style.colorScheme = previousTheme
      }
    }
  }, [])

  useEffect(() => {
    const metadata = selectedSlug && !selectedPost
      ? { title: 'Page Not Found | Pitaka', description: 'This Pitaka article could not be found.', path: '/404', robots: 'noindex, follow' }
      : blogMetadata(selectedPost)
    applySeo(metadata)
    if (selectedSlug && !selectedPost) removeStructuredData('pitaka-page-schema')
    else setStructuredData('pitaka-page-schema', pageSchema(metadata, { posts: BLOG_POSTS, post: selectedPost }))
    setArticleMetadata(selectedPost ? { publishedTime: selectedPost.date, modifiedTime: selectedPost.updated || selectedPost.date, section: selectedPost.category, author: 'Pitaka' } : {})
    return () => { removeStructuredData('pitaka-page-schema'); setArticleMetadata({}) }
  }, [selectedPost, selectedSlug])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handlePopState = () => {
      setSelectedSlug(getInitialBlogSlug())
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('hashchange', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('hashchange', handlePopState)
    }
  }, [])

  if (selectedSlug && !selectedPost) return <NotFound />

  if (selectedPost) {
    return <BlogPost post={selectedPost} onBackToLanding={onBackToLanding} />
  }

  return (
    <div className="blog-page">
      <div className="blog-hero">
        <div className="blog-container">
          {typeof onBackToLanding === 'function' && (
            <a href="/" className="blog-landing-btn">
              Back to Landing
            </a>
          )}
          <h1>Pitaka Blog</h1>
          <p>Personal finance tips, budgeting strategies, and money management insights</p>
        </div>
      </div>

      <div className="blog-container">
        {/* Featured Post */}
        {featuredPost && (
          <article className="blog-featured">
            <div className="blog-featured-content">
              <div className="blog-featured-badge">Featured</div>
              <h2>{featuredPost.title}</h2>
              <p>{featuredPost.excerpt}</p>
              <div className="blog-featured-meta">
                <span className="blog-category">{featuredPost.category}</span>
                <span className="blog-separator">•</span>
                <time dateTime={featuredPost.date}>{new Date(featuredPost.date).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}</time>
                <span className="blog-separator">•</span>
                <span>{featuredPost.readTime}</span>
              </div>
              <a href={`/blogs/${featuredPost.slug}`} className="blog-featured-button">
                Read Full Article
              </a>
            </div>
          </article>
        )}

        {/* Other Posts Grid */}
        <div className="blog-grid">
          {otherPosts.map((post) => (
            <article key={post.id} className="blog-card">
              <div className="blog-card-meta">
                <span className="blog-category">{post.category}</span>
                <span className="blog-read-time">{post.readTime}</span>
              </div>
              <h3 className="blog-card-title">{post.title}</h3>
              <p className="blog-card-excerpt">{post.excerpt}</p>
              <div className="blog-card-footer">
                <time className="blog-date" dateTime={post.date}>{new Date(post.date).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}</time>
                <a href={`/blogs/${post.slug}`} className="blog-read-more">
                  Read More
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}

function BlogPost({ post, onBackToLanding }) {
  return (
    <div className="blog-post-page">
      <div className="blog-post-header">
        <div className="blog-container">
          {typeof onBackToLanding === 'function' && (
            <a href="/" className="blog-landing-btn">
              Back to Landing
            </a>
          )}
          <a href="/blogs" className="blog-back-btn">
            Back to Blog
          </a>
          <h1>{post.title}</h1>
          <div className="blog-post-meta">
            <span className="blog-category">{post.category}</span>
            <span className="blog-separator">•</span>
            <time dateTime={post.date}>{new Date(post.date).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' })}</time>
            <span className="blog-separator">•</span>
            <span>{post.readTime}</span>
          </div>
        </div>
      </div>

      <div className="blog-container">
        <article className="blog-post-content">
          <p className="blog-byline">By Pitaka · General financial education</p>
          {post.updated && <p>Updated <time dateTime={post.updated}>{new Date(post.updated).toLocaleDateString('en-US', { timeZone: 'UTC', dateStyle: 'long' })}</time></p>}
          <p>{post.excerpt}</p>
          {renderBlogContent(post.content)}
          {post.sources?.length > 0 && <section aria-label="Sources"><h2>Sources and further reading</h2><ul>{post.sources.map(source => <li key={source.url}><a href={source.url} rel="noreferrer">{source.title}</a></li>)}</ul></section>}
          <p>Pitaka records and organizes information you enter. It does not connect to banks, move money, or recommend investments. <a href="/features">Explore the tracker’s features</a>.</p>
          <section aria-label="Related guides"><h2>Related guides</h2><ul>{BLOG_POSTS.filter(item => item.slug !== post.slug).slice(0, 3).map(item => <li key={item.slug}><a href={`/blogs/${item.slug}`}>{item.title}</a></li>)}</ul></section>
        </article>

        <div className="blog-post-footer">
          <a href="/blogs" className="blog-read-more">
            Back to All Posts
          </a>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
