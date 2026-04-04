import './Landing.css'
import { useState, useEffect } from 'react'
import Auth from './Auth'
import Blog from './Blog'
import ContactForm from './ContactForm'
import { applySeo, removeStructuredData, setStructuredData } from '../utils/seo'
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
    description: 'Move between web and mobile with the same account, the same data, and the same rhythm.'
  }
]

const proofPoints = [
  { value: 'Web + Mobile', label: 'Use Pitaka wherever you review your finances.' },
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

const faqs = [
  {
    question: 'Is Pitaka free?',
    answer: 'Yes. Core budgeting, tracking, and account management are available without a paid plan.'
  },
  {
    question: 'What is Pitaka Pro?',
    answer: 'Pitaka Pro is a one-time upgrade that unlocks quality-of-life features such as recurring income automation, subscription tracking, investment tracking, full currency support, and Android app access.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Your data is authenticated per user account and stored with the app’s Firebase-backed setup.'
  },
  {
    question: 'Can I use it on mobile?',
    answer: 'Yes. Pitaka is designed for web and mobile usage, with Android and iOS support in the project.'
  },
  {
    question: 'Can I export my records?',
    answer: 'Yes. You can export your data and also import from spreadsheet files when you need to migrate or back up.'
  }
]

export default function Landing({ initialSection = null, onOpenAuthRoute, onOpenBlogRoute }) {
  const [showAuth, setShowAuth] = useState(false)
  const [showBlog, setShowBlog] = useState(false)

  const openAuthRoute = (mode = 'login') => {
    if (typeof onOpenAuthRoute === 'function') {
      onOpenAuthRoute(mode)
      return
    }

    setShowAuth(true)
  }

  const openBlogRoute = () => {
    if (typeof onOpenBlogRoute === 'function') {
      onOpenBlogRoute()
      return
    }

    setShowBlog(true)
  }

  useEffect(() => {
    const previousTheme = document.body.dataset.theme
    document.body.dataset.theme = 'dark'
    document.documentElement.style.colorScheme = 'dark'

    applySeo({
      title: 'Pitaka - Budget Tracker, Expense Manager, and Personal Finance App',
      description: 'Track expenses, manage income, monitor savings goals, and review investments with Pitaka. A personal finance and budget tracking app for web, Android, and iOS.',
      path: typeof window === 'undefined' ? '/' : (window.location.pathname || '/'),
      keywords: 'budget tracker app, expense tracker app, personal finance app, money management app, income and expense tracker, savings goals app, investment tracker app, monthly budget planner, financial dashboard app, web and mobile budget app',
      type: 'website',
      imageAlt: 'Pitaka social share card for budgeting, expenses, savings, and investments'
    })

    setStructuredData('pitaka-website-schema', {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://pitaka-sigma.vercel.app/#organization',
          name: 'Pitaka',
          url: 'https://pitaka-sigma.vercel.app/',
          logo: 'https://pitaka-sigma.vercel.app/pitaka-logo.png',
          sameAs: [
            'https://pitaka-sigma.vercel.app/blogs'
          ]
        },
        {
          '@type': 'WebSite',
          '@id': 'https://pitaka-sigma.vercel.app/#website',
          url: 'https://pitaka-sigma.vercel.app/',
          name: 'Pitaka',
          description: 'Personal finance tracker for budgeting, expenses, savings, and investments.',
          publisher: {
            '@id': 'https://pitaka-sigma.vercel.app/#organization'
          },
          inLanguage: 'en'
        },
        {
          '@type': 'SoftwareApplication',
          name: 'Pitaka',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Web, Android, iOS',
          url: 'https://pitaka-sigma.vercel.app/',
          image: 'https://pitaka-sigma.vercel.app/pitaka-social-share.png',
          description: 'Personal finance tracker for budgeting, expenses, savings, and investments.',
          publisher: {
            '@id': 'https://pitaka-sigma.vercel.app/#organization'
          },
          featureList: [
            'Expense tracking',
            'Income management',
            'Savings goal tracking',
            'Investment tracking',
            'Multi-wallet support',
            'Data export and import'
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Is Pitaka free?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Core budgeting, tracking, and account management are available without a paid plan.'
              }
            },
            {
              '@type': 'Question',
              name: 'What is Pitaka Pro?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Pitaka Pro is a one-time upgrade that unlocks quality-of-life features such as recurring income automation, subscription tracking, investment tracking, full currency support, and Android app access.'
              }
            },
            {
              '@type': 'Question',
              name: 'Is my data secure?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Your data is authenticated per user account and stored with the app’s Firebase-backed setup.'
              }
            },
            {
              '@type': 'Question',
              name: 'Can I use it on mobile?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Pitaka is designed for web and mobile usage, with Android and iOS support in the project.'
              }
            },
            {
              '@type': 'Question',
              name: 'Can I export my records?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. You can export your data and also import from spreadsheet files when you need to migrate or back up.'
              }
            }
          ]
        }
      ],
    })

    return () => {
      if (previousTheme) {
        document.body.dataset.theme = previousTheme
        document.documentElement.style.colorScheme = previousTheme
      }
      removeStructuredData('pitaka-website-schema')
    }
  }, [])

  useEffect(() => {
    if (!initialSection || showAuth || showBlog || typeof document === 'undefined') return

    const sectionElement = document.getElementById(initialSection)
    if (!sectionElement) return

    sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [initialSection, showAuth, showBlog])

  if (showAuth) {
    return <Auth />
  }

  if (showBlog) {
    return <Blog onBackToLanding={() => setShowBlog(false)} />
  }

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
              <a href="#features" className="landing-topbar-link">Features</a>
              <a href="#pricing" className="landing-topbar-link">Pricing</a>
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
                Pitaka gives you one place to track spending, manage accounts, monitor savings, and review the month with clarity.
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
            {featureCards.map(({ icon: Icon, title, description }) => (
              <article key={title} className="landing-feature-card">
                <div className="landing-feature-icon">
                  <Icon size={28} />
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
          <button onClick={openBlogRoute} className="landing-btn landing-btn-secondary landing-btn-lg">
            Read Our Blog
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-shell">
          <div>
            <strong>Pitaka</strong>
            <p>Personal finance tracking for budgets, accounts, savings, and investments.</p>
          </div>
          <p>&copy; 2025 Pitaka. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
