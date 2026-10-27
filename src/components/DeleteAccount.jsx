import { useContext, useState } from 'react'
import { FirebaseContext } from '../contexts/FirebaseContext'

export default function DeleteAccount() {
  const { user, deleteAccount, accountDeleting } = useContext(FirebaseContext)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const usesPassword = user?.providerData?.some(
    (provider) => provider.providerId === 'password'
  )
  const handleDelete = async (event) => {
    event.preventDefault()
    if (accountDeleting || confirmation !== user.email) return
    setError('')
    try {
      await deleteAccount(password)
    } catch (err) {
      setError(
        err.message || 'Could not delete your account. Please try again.'
      )
    }
  }
  return (
    <section className="card account-deletion-card">
      <h2>Delete your Pitaka account</h2>
      <p>
        This permanently removes your sign-in, finance records, savings goals,
        and preferences from Pitaka. Download a backup in More before
        continuing. Payment providers may retain their own transaction records.
      </p>
      <form className="form" onSubmit={handleDelete}>
        <div className="form-group">
          <label htmlFor="delete-confirm-email">
            Type {user.email} to confirm
          </label>
          <input
            id="delete-confirm-email"
            type="email"
            autoComplete="off"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            required
          />
        </div>
        {usesPassword && (
          <div className="form-group">
            <label htmlFor="delete-password">Current password</label>
            <input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
        )}
        {!usesPassword && (
          <p>You’ll be asked to confirm your Google account before deletion.</p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {accountDeleting && (
          <p role="status">
            Deleting your account… Keep this screen open until it finishes.
          </p>
        )}
        <button
          className="btn danger"
          type="submit"
          disabled={
            accountDeleting ||
            confirmation !== user.email ||
            (usesPassword && !password)
          }
        >
          {accountDeleting ? 'Deleting…' : 'Permanently delete account'}
        </button>
      </form>
    </section>
  )
}
