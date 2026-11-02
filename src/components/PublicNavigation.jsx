import './PublicPage.css'

export function PublicHeader({ path }) {
  return (
    <header className="public-header">
      <a href="/" className="public-brand" aria-current={path === '/' ? 'page' : undefined}>
        <img src="/pitaka-logo.png" width="36" height="36" alt="" />
        <span>Pitaka</span>
      </a>
      <nav aria-label="Main">
        {[['/features', 'Features'], ['/pricing', 'Pricing'], ['/blogs', 'Guides']].map(([href, label]) => (
          <a key={href} href={href} aria-current={path === href || path?.startsWith(`${href}/`) ? 'page' : undefined}>{label}</a>
        ))}
      </nav>
      <a href="/login" className="public-sign-in">Sign in</a>
    </header>
  )
}

export function PublicFooter() {
  return <footer className="public-footer"><p>Pitaka · A personal finance tracker with Philippine peso support.</p><nav aria-label="Footer"><a href="/">Home</a><a href="/features">Features</a><a href="/pricing">Pricing</a><a href="/about">About</a><a href="/blogs">Guides</a><a href="/help">Help</a><a href="/contact">Contact</a><a href="/privacy-policy.html">Privacy policy</a><a href="/delete-account">Delete account or data</a></nav></footer>
}
