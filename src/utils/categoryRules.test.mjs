import assert from 'node:assert/strict'
import { suggestCategory } from './categoryRules.js'

const categories = [{ name: 'Food' }, { name: 'Transport' }, { name: 'Subscription' }]

assert.equal(suggestCategory('Weekly groceries', categories), 'Food')
assert.equal(suggestCategory('Grab ride home', categories), 'Transport')
assert.equal(suggestCategory('Spotify Premium', categories), 'Subscription')
assert.equal(suggestCategory('Mystery charge', categories), '')

console.log('categoryRules tests passed')
