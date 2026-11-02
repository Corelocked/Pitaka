import './PublicPage.css'

export function PublicHeader() {
  return <header className="public-header"><a href="/" className="public-brand"><img src="/pitaka-logo.png" width="36" height="36" alt="" />Pitaka</a><nav aria-label="Main"><a href="/features">Features</a><a href="/pricing">Pricing</a><a href="/blogs">Guides</a><a href="/login">Sign in</a></nav></header>
}

export function PublicFooter() {
  return <footer className="public-footer"><p>Pitaka · A personal finance tracker with Philippine peso support.</p><nav aria-label="Footer"><a href="/">Home</a><a href="/features">Features</a><a href="/pricing">Pricing</a><a href="/about">About</a><a href="/blogs">Guides</a><a href="/help">Help</a><a href="/contact">Contact</a><a href="/privacy-policy.html">Privacy policy</a><a href="/delete-account">Delete account or data</a></nav></footer>
}
