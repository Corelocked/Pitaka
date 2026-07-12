import assert from 'node:assert/strict'
import { reportAppError } from './errorReporting.js'

const store = new Map()
const originalError = console.error
console.error = () => {}
global.window = {
  localStorage: {
    getItem: (key) => store.get(key) || null,
    setItem: (key, value) => store.set(key, value)
  }
}

reportAppError('test.scope', new Error('boom'), { id: 1 })

const [entry] = JSON.parse(store.get('pitaka.errorLog'))
assert.equal(entry.scope, 'test.scope')
assert.equal(entry.message, 'boom')
assert.deepEqual(entry.context, { id: 1 })

delete global.window
console.error = originalError
console.log('errorReporting tests passed')
