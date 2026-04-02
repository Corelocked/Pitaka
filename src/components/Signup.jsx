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
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Start managing your finances</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {(formError || error) && <div className="auth-error">{formError || error}</div>}

          <div className="auth-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="auth-input"
              type="email"
              placeholder="your@email.com"
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
          <p>Already have an account? <button onClick={onSwitchToLogin} className="auth-link">Sign In</button></p>
        </div>
      </div>
    </div>
  )
}

export default Signup