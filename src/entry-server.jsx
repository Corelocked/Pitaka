/* eslint-disable react-refresh/only-export-components -- Build-only server entry; never loaded by the browser. */
import { renderToString } from 'react-dom/server'
import { FirebaseContext } from './contexts/FirebaseContext'
import Landing from './components/Landing'
import Blog from './components/Blog'
import PublicPage, { NotFound } from './components/PublicPage'
import AccountDeletionPage from './components/AccountDeletionPage'
import { PUBLIC_PAGES, PRIVATE_PATHS, pageMetadata, blogMetadata, pageSchema, absoluteUrl, FAQS, SITE_UPDATED } from './content/site.mjs'
import { BLOG_POSTS } from './content/blogPosts.mjs'

export { PRIVATE_PATHS, absoluteUrl, FAQS, SITE_UPDATED, BLOG_POSTS }
export const pages = [
  ...Object.keys(PUBLIC_PAGES).map(path => ({ ...pageMetadata(path) })),
  blogMetadata(), ...BLOG_POSTS.map(blogMetadata)
]

export function renderPage(metadata) {
  const post = BLOG_POSTS.find(item => metadata.path === `/blogs/${item.slug}`)
  const component = metadata.path === '/' ? <Landing />
    : metadata.path === '/delete-account' ? <AccountDeletionPage />
    : metadata.path === '/blogs' || post ? <Blog initialSlug={post?.slug} />
    : metadata.path === '/404' ? <NotFound />
    : <PublicPage path={metadata.path} />
  return {
    html: renderToString(<FirebaseContext.Provider value={{ user: null, userProfile: null }}>{component}</FirebaseContext.Provider>),
    schema: pageSchema(metadata, { posts: BLOG_POSTS, post })
  }
}
