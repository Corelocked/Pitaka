import { useState } from 'react'
import './Auth.css'

function Login({ onLogin, onGoogleSignIn, onResetPassword, onSwitchToSignup, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [resetting, setResetting] = useState(false)

  const resetPassword = async () => {
    if (!email.trim()) { setResetMessage('Enter your email address above, then request a reset link.'); return }
    setResetting(true)
    setResetMessage('')
    try {
      await onResetPassword(email)
      setResetMessage('If an account uses this email, you’ll receive a password reset link.')
    } catch (err) {
      setResetMessage(err.code === 'auth/user-not-found' ? 'If an account uses this email, you’ll receive a password reset link.' : 'Could not send a reset link. Check your email address and try again.')
    } finally { setResetting(false) }
  }

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
            <div className="auth-app-mark"><img src="/pitaka-logo.png" alt="" /> Pitaka</div>
            <h1>Welcome back</h1>
            <p>Sign in to pick up where you left off.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error" role="alert">{error}</div>}

            <div className="auth-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                autoComplete="email"
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
              <div className="auth-label-row"><label htmlFor="password">Password</label><button type="button" className="auth-password-toggle" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide password' : 'Show password'}</button></div>
              <input
                id="password"
                autoComplete="current-password"
                className="auth-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button type="button" className="auth-link auth-reset" onClick={resetPassword} disabled={resetting || loading}>{resetting ? 'Sending reset link…' : 'Forgot password?'}</button>
            {resetMessage && <p role="status">{resetMessage}</p>}
            <button type="submit" className="auth-button" disabled={loading || googleLoading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button onClick={handleGoogleSignIn} className="google-button" disabled={googleLoading || loading}>
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
          <p className="auth-policy-links"><a href="https://pitaka-sigma.vercel.app/privacy" target="_blank" rel="noreferrer">Privacy policy</a><span aria-hidden="true"> · </span><a href="/delete-account">Delete account & data</a></p>
        </div>
      </div>
    </div>
  )
}

export default Login
