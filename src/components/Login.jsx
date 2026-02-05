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
    } catch (err) {
      // Error is handled by parent component
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      await onGoogleSignIn()
    } catch (err) {
      // Error is handled by parent component
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your Budget Book account</p>
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
              Signing in with Google...
            </>
          ) : (
            <>
              <div className="google-icon"></div>
              Continue with Google
            </>
          )}
        </button>

        <div className="auth-footer">
          <p>Don't have an account? <button onClick={onSwitchToSignup} className="auth-link">Sign Up</button></p>
        </div>
      </div>
    </div>
  )
}

export default Login