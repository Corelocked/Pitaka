import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing'
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore'

const environment = await initializeTestEnvironment({
  projectId: 'demo-pitaka-review',
  firestore: {
    rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8')
  }
})
try {
  await environment.clearFirestore()
  const owner = environment.authenticatedContext('owner').firestore()
  const other = environment.authenticatedContext('other').firestore()
  const profile = doc(owner, 'users/owner')
  await assertFails(setDoc(profile, { plan: 'pro', tags: ['pro'] }))
  await assertFails(
    setDoc(profile, { plan: 'basic', tags: [], deletionPending: false })
  )
  await assertSucceeds(
    setDoc(profile, { email: 'owner@example.com', plan: 'basic', tags: [] })
  )
  await assertFails(updateDoc(profile, { plan: 'pro' }))
  await assertFails(updateDoc(profile, { tags: ['pro'] }))
  await assertSucceeds(updateDoc(profile, { displayName: 'My account' }))
  await assertSucceeds(
    setDoc(doc(owner, 'wallets/cash'), {
      userId: 'owner',
      name: 'Cash',
      startingBalance: 0,
      currency: 'PHP',
      creditLimit: null,
      creditApr: null,
      creditAlertPercent: null,
      creditMinimumPayment: null
    })
  )
  await assertFails(getDoc(doc(other, 'wallets/cash')))
  await assertFails(updateDoc(doc(owner, 'wallets/cash'), { userId: 'other' }))
  await assertFails(
    setDoc(doc(owner, 'expenses/negative'), { userId: 'owner', amount: -5 })
  )
  await assertFails(
    setDoc(doc(owner, 'expenses/null'), { userId: 'owner', amount: null })
  )
  await assertFails(
    setDoc(doc(owner, 'budgets/string'), { userId: 'owner', amount: '100' })
  )
  await assertSucceeds(
    setDoc(doc(owner, 'budgets/number'), {
      userId: 'owner',
      amount: 100,
      currency: 'PHP'
    })
  )
  await environment.withSecurityRulesDisabled(async (context) => {
    await updateDoc(doc(context.firestore(), 'users/owner'), {
      deletionPending: true,
      plan: 'pro',
      tags: ['pro']
    })
  })
  await assertFails(
    setDoc(doc(owner, 'expenses/locked'), { userId: 'owner', amount: 10 })
  )
  await assertFails(updateDoc(profile, { deletionPending: false }))
  assert.equal((await getDoc(profile)).data().plan, 'pro')
  console.log(
    'Firestore emulator: owner isolation, money validation, Pro entitlement, and deletion lock passed'
  )
} finally {
  await environment.cleanup()
}
