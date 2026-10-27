// Block new client writes before removing data; a failed request can safely be retried.
export const ACCOUNT_COLLECTIONS = [
  'incomes',
  'expenses',
  'wallets',
  'categories',
  'savings',
  'lendings',
  'transfers',
  'investments',
  'subscriptions',
  'recurringIncomes',
  'budgets',
  'netWorthSnapshots',
  'billingSessions'
]

export async function deleteAccountData(db, userId, deleteIdentity) {
  // shortcut: deletion runs in one request; use a durable job when accounts approach the hosting timeout.
  const profile = db.collection('users').doc(userId)
  await profile.set({ deletionPending: true }, { merge: true })
  for (const name of ACCOUNT_COLLECTIONS) {
    const owned = db.collection(name).where('userId', '==', userId).limit(400)
    while (true) {
      const snapshot = await owned.get()
      if (snapshot.empty) break
      const batch = db.batch()
      snapshot.docs.forEach((document) => batch.delete(document.ref))
      await batch.commit()
    }
  }
  // Keep the identity until all finance records are removed so failures remain retryable.
  await deleteIdentity(userId)
  await profile.delete()
}
