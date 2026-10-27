import React, { createContext, useEffect, useState } from 'react'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithCredential, signInWithPopup, EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase'
import { getAuthErrorMessage } from '../utils/authErrors'
import { userProfileService } from '../services/firebaseService'

const FirebaseContext = createContext()
const NativeGoogleAuth = registerPlugin('NativeGoogleAuth')

export function FirebaseProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authResolved, setAuthResolved] = useState(false)
  const [error, setError] = useState(null)
  const [accountDeleting, setAccountDeleting] = useState(false)

  // Firebase authentication
  useEffect(() => {
    // Add a timeout to force loading to false after 10 seconds
    const authTimeout = setTimeout(() => {
      setLoading(false)
      setAuthResolved(true)
      setError('Authentication required. Please sign in to add income and expenses.')
      setUser(null) // Clear user to force re-authentication
    }, 10000)

    // Listen for authentication state changes
    let unsubscribeProfile = null
    let generation = 0

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const currentGeneration = ++generation
      unsubscribeProfile?.()
      unsubscribeProfile = null
      setUserProfile(null)
      clearTimeout(authTimeout) // Clear the timeout since we got a response
      setAuthResolved(true)

      if (user) {
        setUser(user)
        setError(null)

        try {
          await userProfileService.ensureUserProfile(user)
          if (currentGeneration !== generation) return
          unsubscribeProfile = userProfileService.subscribeToUserProfile(user.uid, (profile) => {
            setUserProfile(profile)
            setLoading(false)
          })
        } catch (err) {
          if (currentGeneration !== generation) return
          console.error('Failed to initialize user profile:', err)
          setUserProfile(null)
          setError('Your profile could not load. Please check your connection and sign in again.')
          setLoading(false)
        }
      } else {
        // User is not authenticated, stay in loading state until they authenticate
        setUser(null)
        setUserProfile(null)
        setLoading(false)
      }
    })

    return () => {
      generation++
      clearTimeout(authTimeout)
      unsubscribeProfile?.()
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
      setLoading(false)
      throw err
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
      setLoading(false)
      throw err
    }
  }

  const logout = async () => {
    try {
      setError(null)
      await signOut(auth)
      if (Capacitor.getPlatform() === 'android') {
        await NativeGoogleAuth.signOut().catch(() => {})
      }
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
      if (Capacitor.getPlatform() === 'android') {
        const { idToken } = await NativeGoogleAuth.signIn()
        const credential = GoogleAuthProvider.credential(idToken)
        await signInWithCredential(auth, credential)
      } else {
        const provider = new GoogleAuthProvider()
        await signInWithPopup(auth, provider)
      }
    } catch (err) {
      console.error('Auth googleSignIn error:', err)
      const msg = getAuthErrorMessage(err)
      setError(msg)
      setLoading(false)
      throw err
    }
  }

  const isPro = userProfile?.plan === 'pro' || userProfile?.tags?.includes?.('pro')

  const deleteAccount = async (password) => {
    if (!user || accountDeleting) return
    setAccountDeleting(true)
    try {
      if (user.providerData.some((provider) => provider.providerId === 'password')) {
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password))
      } else if (Capacitor.getPlatform() === 'android') {
        const { idToken } = await NativeGoogleAuth.signIn()
        await reauthenticateWithCredential(user, GoogleAuthProvider.credential(idToken))
      } else {
        await reauthenticateWithPopup(user, new GoogleAuthProvider())
      }
      const base = import.meta.env.VITE_ACCOUNT_API_BASE || import.meta.env.VITE_BILLING_API_BASE || (Capacitor.isNativePlatform() ? 'https://pitaka-sigma.vercel.app/api' : '/api')
      const response = await fetch(`${base.replace(/\/$/, '')}/account/delete`, { method: 'POST', headers: { Authorization: `Bearer ${await user.getIdToken(true)}` } })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.ok) throw new Error(result.error || 'Account deletion is temporarily unavailable. Please try again later.')
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith(`pitaka.summaryCache:${user.uid}:`)) localStorage.removeItem(key)
      }
      for (const key of ['pitaka.themePreferences', 'pitaka.dashboardLayouts']) {
        try { const preferences = JSON.parse(localStorage.getItem(key) || '{}'); delete preferences[user.uid]; localStorage.setItem(key, JSON.stringify(preferences)) } catch { localStorage.removeItem(key) }
      }
      await logout()
    } catch (err) {
      if (err.code?.startsWith('auth/')) throw new Error(getAuthErrorMessage(err))
      throw err
    } finally {
      setAccountDeleting(false)
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    authResolved,
    error,
    login,
    signup,
    logout,
    googleSignIn,
    resetPassword: (email) => sendPasswordResetEmail(auth, email.trim()),
    deleteAccount,
    accountDeleting,
    isAuthenticated: !!user,
    isPro
  }

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  )
}

export { FirebaseContext }
