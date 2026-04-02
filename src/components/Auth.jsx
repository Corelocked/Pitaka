import { useState, useContext, useEffect } from 'react'
import { FirebaseContext } from '../contexts/FirebaseContext'
import Login from './Login'
import Signup from './Signup'

function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const { login, signup, googleSignIn, error } = useContext(FirebaseContext)

  useEffect(() => {
    // Set dark theme for auth pages
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