import React, { createContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../firebase'
import { getAuthErrorMessage } from '../utils/authErrors'

const FirebaseContext = createContext()

export function FirebaseProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Firebase authentication
  useEffect(() => {
    // Add a timeout to force loading to false after 10 seconds
    const authTimeout = setTimeout(() => {
      setLoading(false)
      setError('Authentication required. Please sign in to add income and expenses.')
      setUser(null) // Clear user to force re-authentication
    }, 10000)

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(authTimeout) // Clear the timeout since we got a response
      
      if (user) {
        setUser(user)
        setError(null)
      } else {
        // User is not authenticated, stay in loading state until they authenticate
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      clearTimeout(authTimeout)
      unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    try {
      setError(null)
      setLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      console.error('Auth login error:', err)
      const msg = getAuthErrorMessage(err)
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signup = async (email, password) => {
    try {
      setError(null)
      setLoading(true)
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (err) {
      console.error('Auth signup error:', err)
      const msg = getAuthErrorMessage(err)
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setError(null)
      await signOut(auth)
    } catch (err) {
      console.error('Auth logout error:', err)
      const msg = getAuthErrorMessage(err)
      setError(msg)
      throw err
    }
  }

  const googleSignIn = async () => {
    try {
      setError(null)
      setLoading(true)
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (err) {
      console.error('Auth googleSignIn error:', err)
      const msg = getAuthErrorMessage(err)
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    googleSignIn,
    isAuthenticated: !!user
  }

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  )
}

export { FirebaseContext }