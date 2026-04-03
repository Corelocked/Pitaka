import { useState } from 'react'
import './Auth.css'

function Login({ onLogin, onGoogleSignIn, onSwitchToSignup, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    try {
      await onLogin(email, password)
    } catch {
      // Error is handled by parent component
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      await onGoogleSignIn()
    } catch {
      // Error is handled by parent component
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-shell">
        <aside className="auth-showcase">
          <div className="auth-brand">
            <div className="auth-brand-mark">Pitaka</div>
            <h1>Your personal finance system, in one place.</h1>
            <p>Review spending, track accounts, plan goals, and stay closer to the shape of your month without juggling scattered tools.</p>
          </div>

          <div className="auth-showcase-grid" aria-hidden="true">
            <div className="auth-showcase-card">
              <span className="auth-showcase-label">Track</span>
              <span className="auth-showcase-value">Expenses</span>
              <p>Capture income, spending, and transfers with a cleaner daily workflow.</p>
            </div>
            <div className="auth-showcase-card">
              <span className="auth-showcase-label">Monitor</span>
              <span className="auth-showcase-value">Accounts</span>
              <p>See balances across cash, banks, e-wallets, and investments.</p>
            </div>
            <div className="auth-showcase-card auth-showcase-card--wide">
              <span className="auth-showcase-label">Plan</span>
              <span className="auth-showcase-value">Monthly clarity</span>
              <p>Use Pitaka as a practical control panel for budgets, savings goals, and financial review.</p>
            </div>
          </div>
        </aside>

        <div className="auth-card">
          <div className="auth-header">
            <h1>Sign In</h1>
            <p>Welcome back. Continue with your email or use Google to get into Pitaka faster.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            <div className="auth-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="auth-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="auth-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className="auth-input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button onClick={handleGoogleSignIn} className="google-button" disabled={googleLoading}>
            {googleLoading ? (
              <>
                <div className="google-icon-loading"></div>
                Signing in...
              </>
            ) : (
              <>
                <div className="google-icon"></div>
                Continue with Google
              </>
            )}
          </button>

          <div className="auth-switch">
            <p>Don&apos;t have an account? <button onClick={onSwitchToSignup} className="auth-link">Create one</button></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
