import React, { createContext, useEffect, useState } from 'react'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, signInWithCredential } from 'firebase/auth'
import { auth } from '../firebase'
import { getAuthErrorMessage } from '../utils/authErrors'
import { userProfileService } from '../services/firebaseService'

const FirebaseContext = createContext()
const NativeGoogleAuth = registerPlugin('NativeGoogleAuth')

export function FirebaseProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
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
    let unsubscribeProfile = null

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(authTimeout) // Clear the timeout since we got a response

      if (user) {
        setUser(user)
        setError(null)

        try {
          await userProfileService.ensureUserProfile(user)
          unsubscribeProfile?.()
          unsubscribeProfile = userProfileService.subscribeToUserProfile(user.uid, (profile) => {
            setUserProfile(profile)
            // Log userProfile changes for debugging
            console.log('[FirebaseContext] userProfile updated:', profile)
          })
        } catch (err) {
          console.error('Failed to initialize user profile:', err)
          setUserProfile(null)
          setError('Signed in, but profile access is blocked. Please update Firestore rules for the users collection.')
        }
      } else {
        // User is not authenticated, stay in loading state until they authenticate
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
      // Log user and userProfile for debugging
      console.log('[FirebaseContext] user:', user)
      console.log('[FirebaseContext] userProfile:', userProfile)
    })

    return () => {
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
      throw err
    } finally {
      setLoading(false)
    }
  }

  const isPro = userProfile?.plan === 'pro' || userProfile?.tags?.includes?.('pro')

  const value = {
    user,
    userProfile,
    loading,
    error,
    login,
    signup,
    logout,
    googleSignIn,
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
