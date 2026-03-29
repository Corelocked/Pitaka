import admin from 'firebase-admin'

let firestoreDb = null

export function getFirestore(config) {
  if (firestoreDb) return firestoreDb

  if (!config.firebaseProjectId || !config.firebaseClientEmail || !config.firebasePrivateKey) {
    throw new Error('Missing Firebase Admin credentials in env variables')
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebaseProjectId,
        clientEmail: config.firebaseClientEmail,
        privateKey: config.firebasePrivateKey.replace(/\\n/g, '\n')
      })
    })
  }

  firestoreDb = admin.firestore()
  return firestoreDb
}

export async function savePendingCheckoutSession(config, session) {
  const db = getFirestore(config)
  await db.collection('billingSessions').doc(session.id).set(
    {
      ...session,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  )
}

export async function markCheckoutSessionPaid(config, sessionId, eventPayload) {
  const db = getFirestore(config)
  const sessionRef = db.collection('billingSessions').doc(sessionId)
  const sessionSnapshot = await sessionRef.get()

  if (!sessionSnapshot.exists) {
    throw new Error(`Unknown billing session: ${sessionId}`)
  }

  const session = sessionSnapshot.data()
  const userId = session.userId

  if (!userId) {
    throw new Error(`Billing session ${sessionId} is missing userId`)
  }

  const userRef = db.collection('users').doc(userId)
  const userSnapshot = await userRef.get()
  const userData = userSnapshot.exists ? userSnapshot.data() : {}
  const existingTags = Array.isArray(userData.tags) ? userData.tags : []
  const nextTags = Array.from(new Set([...existingTags, 'pro']))

  await userRef.set(
    {
      ...userData,
      plan: 'pro',
      tags: nextTags,
      updatedAt: new Date()
    },
    { merge: true }
  )

  await sessionRef.set(
    {
      status: 'paid',
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      latestEventType: eventPayload?.data?.attributes?.type || '',
      latestEventId: eventPayload?.data?.id || ''
    },
    { merge: true }
  )
}
