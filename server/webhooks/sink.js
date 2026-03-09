import admin from 'firebase-admin'

let firestoreDb = null

function initializeFirestore(config) {
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

export function createEventSink(config) {
  if (config.sinkMode === 'log') {
    return {
      async save(event) {
        console.log('[webhook-event]', JSON.stringify(event))
      }
    }
  }

  return {
    async save(event) {
      const db = initializeFirestore(config)
      await db
        .collection('externalTransactions')
        .doc(event.provider)
        .collection('events')
        .doc(event.eventId)
        .set(
          {
            ...event,
            ingestedAt: new Date().toISOString()
          },
          { merge: true }
        )
    }
  }
}
