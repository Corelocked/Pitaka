import { useState } from 'react'
import './Auth.css'

function Signup({ onSignup, onSwitchToLogin, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password || !confirmPassword) return

    if (password !== confirmPassword) {
      return // Error will be handled by parent
    }

    setLoading(true)
    try {
      await onSignup(email, password)
    } catch (err) {
      // Error is handled by parent component
    } finally {
      setLoading(false)
    }
  }

  const passwordsMatch = password === confirmPassword && password.length > 0

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join Budget Book to manage your finances</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className={!passwordsMatch && confirmPassword ? 'error' : ''}
            />
            {!passwordsMatch && confirmPassword && (
              <span className="password-error">Passwords do not match</span>
            )}
          </div>

          <button type="submit" className="auth-button" disabled={loading || !passwordsMatch}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <button onClick={onSwitchToLogin} className="auth-link">Sign In</button></p>
        </div>
      </div>
    </div>
  )
}

export default Signup