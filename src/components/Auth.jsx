import { useState, useContext, useEffect } from 'react'
import { FirebaseContext } from '../contexts/FirebaseContext'
import Login from './Login'
import Signup from './Signup'

function Auth({ initialMode = 'login' }) {
  const [isLogin, setIsLogin] = useState(() => initialMode !== 'signup')
  const { login, signup, googleSignIn, error } = useContext(FirebaseContext)

  useEffect(() => {
    setIsLogin(initialMode !== 'signup')
  }, [initialMode])

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

    return () => {
      appearance.removeEventListener('change', applySystemAppearance)
      if (previousTheme) {
        document.body.dataset.theme = previousTheme
        document.documentElement.style.colorScheme = previousTheme
      }
    }
  }, [])

  const handleLogin = async (email, password) => {
    await login(email, password)
  }

  const handleSignup = async (email, password) => {
    await signup(email, password)
  }

  const handleGoogleSignIn = async () => {
    await googleSignIn()
  }

  const switchToSignup = () => setIsLogin(false)
  const switchToLogin = () => setIsLogin(true)

  if (isLogin) {
    return (
      <Login
        onLogin={handleLogin}
        onGoogleSignIn={handleGoogleSignIn}
        onSwitchToSignup={switchToSignup}
        error={error}
      />
    )
  }

  return (
    <Signup
      onSignup={handleSignup}
      onSwitchToLogin={switchToLogin}
      error={error}
    />
  )
}

export default Auth
