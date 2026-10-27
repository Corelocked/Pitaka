import assert from 'node:assert/strict'
import { ACCOUNT_COLLECTIONS, deleteAccountData } from './accountDeletion.js'

function fixture(fail = false) {
  const log = []
  const rows = new Map(ACCOUNT_COLLECTIONS.map((name) => [name, Array.from({ length: name === 'expenses' ? 405 : 1 }, (_, i) => ({ ref: `${name}:${i}` }))]))
  const db = {
    collection(name) {
      return {
        doc(uid) { assert.equal(uid, 'owner'); return { async set(data) { log.push(data) }, async delete() { log.push('profile deleted') } } },
        where(field, operator, uid) {
          assert.deepEqual([field, operator, uid], ['userId', '==', 'owner'])
          return { limit(size) { return { async get() { const docs = rows.get(name).slice(0, size); return { empty: !docs.length, docs } } } } }
        }
      }
    },
    batch() {
      const deleted = []
      return { delete(ref) { deleted.push(ref) }, async commit() { if (fail) throw new Error('unavailable'); for (const ref of deleted) { const name = ref.split(':')[0]; rows.set(name, rows.get(name).filter((entry) => entry.ref !== ref)) } log.push(`batch ${deleted.length}`) } }
    }
  }
  return { db, rows, log }
}
const good = fixture()
await deleteAccountData(good.db, 'owner', async (uid) => { assert.equal(uid, 'owner'); good.log.push('identity deleted') })
assert.deepEqual(good.log[0], { deletionPending: true })
assert.ok(good.log.includes('batch 400'))
assert.ok(good.log.includes('batch 5'))
assert.ok([...good.rows.values()].every((rows) => !rows.length))
assert.deepEqual(good.log.slice(-2), ['identity deleted', 'profile deleted'])
const bad = fixture(true)
await assert.rejects(deleteAccountData(bad.db, 'owner', async () => assert.fail('Identity must survive a data deletion failure')))
assert.equal(bad.rows.get('expenses').length, 405)
assert.ok(!bad.log.includes('profile deleted'))
console.log('account deletion ordering, scope, batching, and failure checks passed')
