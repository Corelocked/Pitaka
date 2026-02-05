export function getAuthErrorMessage(err) {
  const code = err?.code || ''

  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with that email.'
    case 'auth/wrong-password':
      return 'Incorrect password — please try again.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support if this is an error.'
    case 'auth/email-already-in-use':
      return 'An account with that email already exists.'
    case 'auth/weak-password':
      return 'Password is too weak — use at least 6 characters.'
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.'
    case 'auth/popup-blocked':
      return 'Sign-in popup blocked by your browser. Allow popups and try again.'
    default:
      return (err && err.message) ? err.message : 'Authentication failed. Please try again.'
  }
}
