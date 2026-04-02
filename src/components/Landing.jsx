import './Landing.css'
import { useState, useEffect } from 'react'
import Auth from './Auth'
import Blog from './Blog'
import { 
  ExpenseIcon, 
  IncomeIcon, 
  WalletIcon, 
  TrendUpIcon, 
  ChartIcon, 
  ActivityIcon 
} from './Icons'

export default function Landing() {
  const [showAuth, setShowAuth] = useState(false)
  const [showBlog, setShowBlog] = useState(false)

  useEffect(() => {
    // Set dark theme for landing page
    const previousTheme = document.body.dataset.theme
    document.body.dataset.theme = 'dark'
    document.documentElement.style.colorScheme = 'dark'

    return () => {
      // Restore previous theme on unmount
      if (previousTheme) {
        document.body.dataset.theme = previousTheme
        document.documentElement.style.colorScheme = previousTheme
      }
    }
  }, [])

  if (showAuth) {
    return <Auth />
  }

  if (showBlog) {
    return <Blog onBackToLanding={() => setShowBlog(false)} />
  }

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1>Pitaka</h1>
          <p className="landing-hero-tagline">
            Smart personal finance management
          </p>
          <p className="landing-hero-description">
            Track expenses, manage budgets, monitor investments, and take control of your financial future—all in one beautiful app.
          </p>
          <div className="landing-cta-buttons">
            <button onClick={() => setShowAuth(true)} className="landing-btn landing-btn-primary">
              Get Started Free
            </button>
            <button onClick={() => setShowAuth(true)} className="landing-btn landing-btn-secondary">
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features">
        <div className="landing-container">
          <h2>Everything You Need</h2>
          <div className="landing-features-grid">
            <article className="landing-feature-card">
              <div className="landing-feature-icon">
                <ExpenseIcon size={32} />
              </div>
              <h3>Expense Tracking</h3>
              <p>Categorize and track every expense. Understand spending patterns with detailed analytics.</p>
            </article>
            <article className="landing-feature-card">
              <div className="landing-feature-icon">
                <IncomeIcon size={32} />
              </div>
              <h3>Income Management</h3>
              <p>Log all income sources and visualize your complete financial flow in real-time.</p>
            </article>
            <article className="landing-feature-card">
              <div className="landing-feature-icon">
                <WalletIcon size={32} />
              </div>
              <h3>Multi-Wallet Support</h3>
              <p>Manage multiple accounts and keep track of balances across all your wallets.</p>
            </article>
            <article className="landing-feature-card">
              <div className="landing-feature-icon">
                <TrendUpIcon size={32} />
              </div>
              <h3>Investment Tracking</h3>
              <p>Monitor your portfolio and track investment performance metrics.</p>
            </article>
            <article className="landing-feature-card">
              <div className="landing-feature-icon">
                <ChartIcon size={32} />
              </div>
              <h3>Budgeting Tools</h3>
              <p>Set category budgets and monitor spending against your financial goals.</p>
            </article>
            <article className="landing-feature-card">
              <div className="landing-feature-icon">
                <ActivityIcon size={32} />
              </div>
              <h3>Cross-Platform</h3>
              <p>Access your finances on web, iOS, or Android with instant synchronization.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="landing-benefits">
        <div className="landing-container">
          <h2>Why Pitaka?</h2>
          <ul className="landing-benefits-list">
            <li>Real-time data sync across all your devices</li>
            <li>Secure Firebase authentication</li>
            <li>Detailed financial reports and insights</li>
            <li>Export data to CSV and Excel</li>
            <li>Mobile-first responsive design</li>
            <li>Completely free to use</li>
            <li>Privacy-focused and secure</li>
          </ul>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="landing-faq">
        <div className="landing-container">
          <h2>Questions?</h2>
          <div className="landing-faq-grid">
            <article className="landing-faq-card">
              <h3>Is Pitaka free?</h3>
              <p>Yes! Pitaka is completely free with all core features included.</p>
            </article>
            <article className="landing-faq-card">
              <h3>Is my data secure?</h3>
              <p>Your data is encrypted and stored securely. Only you can access your information.</p>
            </article>
            <article className="landing-faq-card">
              <h3>Mobile support?</h3>
              <p>Use Pitaka on web, iOS, or Android with full synchronization.</p>
            </article>
            <article className="landing-faq-card">
              <h3>Export my data?</h3>
              <p>Yes, export all your data to CSV and Excel formats anytime.</p>
            </article>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta">
        <div className="landing-container">
          <h2>Ready to take control?</h2>
          <p>Start managing your finances smarter today</p>
          <button onClick={() => setShowAuth(true)} className="landing-btn landing-btn-primary landing-btn-lg">
            Create Free Account
          </button>
        </div>
      </section>

      {/* Blog Teaser Section */}
      <section className="landing-blog-teaser">
        <div className="landing-container">
          <h2>Financial Insights from Pitaka</h2>
          <p>Tips, strategies, and insights to help you master your money</p>
          <button onClick={() => setShowBlog(true)} className="landing-btn landing-btn-secondary landing-btn-lg">
            Read Our Blog
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container">
          <p>&copy; 2025 Pitaka. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
