import { useState, useEffect } from 'react'
import './Auth.css'

function Signup({ onSignup, onSwitchToLogin, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password || !confirmPassword) return

    if (password !== confirmPassword) {
      setFormError('Passwords do not match')
      return
    }

    setFormError(null)

    setLoading(true)
    try {
      await onSignup(email, password)
    } catch (err) {
      // If parent/context provided an error message, prefer that, otherwise use the thrown error
      if (!error) setFormError(err?.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const passwordsMatch = password === confirmPassword && password.length > 0

  useEffect(() => {
    // Clear local form error when global error from context changes
    if (error) setFormError(null)
  }, [error])

  return (
    <div className="auth-container">
      <div className="auth-shell">
        <aside className="auth-showcase">
          <div className="auth-brand">
            <div className="auth-brand-mark">Pitaka</div>
            <h1>Build a calmer way to manage your money.</h1>
            <p>Create your account to start tracking expenses, organizing accounts, and shaping a budgeting workflow you can actually maintain.</p>
          </div>

          <div className="auth-showcase-grid" aria-hidden="true">
            <div className="auth-showcase-card">
              <span className="auth-showcase-label">Record</span>
              <span className="auth-showcase-value">Daily flow</span>
              <p>Keep income, expenses, and transfers in one consistent system.</p>
            </div>
            <div className="auth-showcase-card">
              <span className="auth-showcase-label">Organize</span>
              <span className="auth-showcase-value">Accounts</span>
              <p>Separate cash, banks, and e-wallets without losing the full picture.</p>
            </div>
            <div className="auth-showcase-card auth-showcase-card--wide">
              <span className="auth-showcase-label">Grow</span>
              <span className="auth-showcase-value">Goals and habits</span>
              <p>Use savings goals, categories, and recurring review to keep your financial system intentional.</p>
            </div>
          </div>
        </aside>

        <div className="auth-card">
          <div className="auth-header">
            <h1>Create Account</h1>
            <p>Start with your email and password, then move into Pitaka with a workspace ready for real monthly use.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {(formError || error) && <div className="auth-error">{formError || error}</div>}

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
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength="6"
              />
            </div>

            <div className="auth-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                className={`auth-input ${!passwordsMatch && confirmPassword ? 'error' : ''}`}
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
              {!passwordsMatch && confirmPassword && (
                <span className="password-error">Passwords do not match</span>
              )}
            </div>

            <button type="submit" className="auth-button" disabled={loading || !passwordsMatch}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-switch">
            <p>Already have an account? <button onClick={onSwitchToLogin} className="auth-link">Sign in</button></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
