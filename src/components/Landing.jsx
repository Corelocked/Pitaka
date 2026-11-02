import './Landing.css'
import { useEffect } from 'react'
import ContactForm from './ContactForm'
import { applySeo, removeStructuredData, setStructuredData } from '../utils/seo'
import { FAQS as faqs, pageMetadata, pageSchema } from '../content/site.mjs'
import { PublicFooter } from './PublicNavigation'
import {
  ExpenseIcon,
  IncomeIcon,
  WalletIcon,
  TrendUpIcon,
  ChartIcon,
  ActivityIcon
} from './Icons'

const featureCards = [
  {
    icon: ExpenseIcon,
    title: 'Expense Tracking',
    description: 'Capture daily spending with categories that make pressure points obvious before they become habits.'
  },
  {
    icon: IncomeIcon,
    title: 'Income Management',
    description: 'See how money enters your system and compare earnings against spending in one running view.'
  },
  {
    icon: WalletIcon,
    title: 'Multi-Wallet View',
    description: 'Keep cash, banks, e-wallets, and cards organized without losing the full picture.'
  },
  {
    icon: TrendUpIcon,
    title: 'Savings And Wealth',
    description: 'Track goals and investments side by side so growth feels measurable, not abstract.'
  },
  {
    icon: ChartIcon,
    title: 'Budget Clarity',
    description: 'Use visual summaries to understand where the month is drifting and where it is holding.'
  },
  {
    icon: ActivityIcon,
    title: 'Cross-Platform Access',
    description: 'Use the website now. The Android app is currently in closed testing for selected testers.'
  }
]

const proofPoints = [
  { value: 'Web + Android Test', label: 'Web available now; Android is in closed testing.' },
  { value: 'Realtime Sync', label: 'Updates flow across devices as your data changes.' },
  { value: 'Private By Default', label: 'Your financial records stay scoped to your account.' }
]

const benefitColumns = [
  {
    eyebrow: 'What stays simple',
    items: [
      'Quick income, expense, and transfer logging',
      'Clean views for accounts, categories, and trends',
      'Excel export and import when you need portability'
    ]
  },
  {
    eyebrow: 'What gets stronger',
    items: [
      'A sharper sense of monthly cash movement',
      'Better visibility into spending pressure',
      'A calmer workflow for planning goals and savings'
    ]
  }
]


export default function Landing({ onOpenAuthRoute }) {
  const openAuthRoute = (mode = 'login') => {
    if (typeof onOpenAuthRoute === 'function') onOpenAuthRoute(mode)
    else window.location.assign(mode === 'signup' ? '/signup' : '/login')
  }

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

    const metadata = pageMetadata('/')
    applySeo(metadata)
    setStructuredData('pitaka-page-schema', pageSchema(metadata))

    return () => {
      appearance.removeEventListener('change', applySystemAppearance)
      if (previousTheme) {
        document.body.dataset.theme = previousTheme
        document.documentElement.style.colorScheme = previousTheme
      }
      removeStructuredData('pitaka-page-schema')
    }
  }, [])

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-container">
          <header className="landing-topbar" aria-label="Primary">
            <div className="landing-topbar-brand">
              <img src="/pitaka-logo.png" alt="Pitaka logo - personal finance and budget tracker app" className="landing-brand-mark" />
              <span className="landing-brand-wordmark">Pitaka</span>
            </div>

            <nav className="landing-topbar-nav" aria-label="Main navigation">
              <a href="/features" className="landing-topbar-link">Features</a>
              <a href="/pricing" className="landing-topbar-link">Pricing</a>
              <button type="button" onClick={() => openAuthRoute('login')} className="landing-topbar-link landing-topbar-link--button">
                Sign In
              </button>
              <button type="button" onClick={() => openAuthRoute('signup')} className="landing-btn landing-btn-primary landing-topbar-cta">
                Get Started Free
              </button>
            </nav>
          </header>

          <div className="landing-hero-layout">
            <div className="landing-hero-copy">
              <div className="landing-brand-row" aria-hidden="true">
                <img src="/pitaka-logo.png" alt="" className="landing-brand-mark" />
                <span className="landing-brand-wordmark">Pitaka</span>
              </div>
              <span className="landing-eyebrow">Private Finance Workspace</span>
              <h1>Budget with more control and less noise.</h1>
              <p className="landing-hero-description">
                Pitaka is a personal finance and budget tracker for individuals and households. Record expenses, income, accounts, and savings goals in Philippine pesos or US dollars, then review your month in one place.
              </p>

              <div className="landing-cta-buttons">
                <button onClick={() => openAuthRoute('signup')} className="landing-btn landing-btn-primary">
                  Get Started Free
                </button>
                <button onClick={() => openAuthRoute('login')} className="landing-btn landing-btn-secondary">
                  Sign In
                </button>
              </div>

              <div className="landing-proof-strip">
                {proofPoints.map((point) => (
                  <div key={point.value} className="landing-proof-card">
                    <strong>{point.value}</strong>
                    <span>{point.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="landing-hero-showcase landing-hero-showcase--screens">
              <figure className="landing-screenshot-frame landing-screenshot-frame--desktop">
                <picture>
                  <source media="(min-width: 981px)" srcSet="/pitaka-dashboard-desktop-cropped.webp" />
                  <img
                    src="/pitaka-dashboard-desktop.webp"
                    alt="Pitaka personal finance dashboard on desktop showing budget overview, expense tracking, income totals, and monthly net position"
                    width="1600"
                    height="1000"
                  />
                </picture>
              </figure>

              <figure className="landing-screenshot-frame landing-screenshot-frame--mobile">
                <img
                  src="/pitaka-dashboard-mobile.webp"
                  alt="Pitaka mobile budget tracker interface showing account balances, income and expense cards, and quick finance navigation"
                  width="900"
                  height="1600"
                />
              </figure>
            </div>
          </div>

          <div className="landing-hero-divider" aria-hidden="true" />
        </div>
      </section>

      <section className="landing-features" id="features">
        <div className="landing-container">
          <div className="landing-section-heading">
            <span className="landing-eyebrow">Core Surface</span>
            <h2>Everything arranged around real financial decisions</h2>
            <p>
              The product is built to make everyday money review faster, more legible, and less fragmented across tools.
            </p>
          </div>

          <div className="landing-features-grid">
            {featureCards.map(({ icon, title, description }) => (
              <article key={title} className="landing-feature-card">
                <div className="landing-feature-icon">
                  {icon({ size: 28 })}
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-editorial-band" id="about">
        <div className="landing-container landing-editorial-layout">
          <div className="landing-editorial-copy">
            <span className="landing-eyebrow">Why It Feels Different</span>
            <h2>A calmer operating view for your money</h2>
            <p>
              Instead of scattering budgets, balances, transactions, and goals across disconnected screens, Pitaka keeps them in one flow. You review what changed, what is drifting, and what still has room.
            </p>
          </div>
          <div className="landing-editorial-note">
            <p>
              Designed for people who want a modern finance tracker without the clutter of a full banking app.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-benefits">
        <div className="landing-container">
          <div className="landing-section-heading">
            <span className="landing-eyebrow">Why Pitaka</span>
            <h2>Useful on day one, deeper as your system matures</h2>
          </div>

          <div className="landing-benefits-columns">
            {benefitColumns.map((column) => (
              <article key={column.eyebrow} className="landing-benefits-column">
                <span className="landing-benefits-eyebrow">{column.eyebrow}</span>
                <ul className="landing-benefits-list">
                  {column.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-faq" id="help">
        <div className="landing-container">
          <div className="landing-section-heading">
            <span className="landing-eyebrow">Questions</span>
            <h2>What people usually ask first</h2>
          </div>

          <div className="landing-faq-grid">
            {faqs.map((item) => (
              <article key={item.question} className="landing-faq-card">
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-contact" id="contact">
        <div className="landing-container">
          <div className="landing-contact-shell">
            <div className="landing-contact-intro">
              <span className="landing-eyebrow">Open Line</span>
              <h2>Feedback, suggestions, or concerns</h2>
              <p>
                Send a note directly from the site if you found a bug, want a feature, or need to raise a concern about the app.
              </p>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>

      <section className="landing-cta" id="pricing">
        <div className="landing-container landing-cta-shell">
          <div>
            <span className="landing-eyebrow">Start Now</span>
            <h2>Ready to take control?</h2>
            <p>Start managing your finances with a cleaner system and a sharper monthly view.</p>
          </div>
          <button onClick={() => openAuthRoute('signup')} className="landing-btn landing-btn-primary landing-btn-lg">
            Create Free Account
          </button>
        </div>
      </section>

      <section className="landing-blog-teaser">
        <div className="landing-container landing-blog-shell">
          <div>
            <span className="landing-eyebrow">Read More</span>
            <h2>Financial insights from Pitaka</h2>
            <p>Tips, strategies, and grounded thinking to help you manage money with more discipline.</p>
          </div>
          <a href="/blogs" className="landing-btn landing-btn-secondary landing-btn-lg">
            Read Our Blog
          </a>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
