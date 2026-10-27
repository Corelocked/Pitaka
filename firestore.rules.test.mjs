import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const rules = readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8')

assert.match(rules, /function ownsBoth\(\)/)
assert.match(rules, /resource\.data\.userId == request\.auth\.uid/)
assert.match(rules, /request\.resource\.data\.userId == request\.auth\.uid/)
assert.match(rules, /function nonNegativeNumber\(field\)/)
assert.match(rules, /request\.resource\.data\[field\] >= 0/)
assert.match(rules, /match \/netWorthSnapshots\/\{snapshotId\}/)
assert.match(rules, /allow update: if ownsBoth\(\)/)
assert.match(rules, /request\.resource\.data\.plan == 'basic'/)
assert.match(rules, /request\.resource\.data\.tags == \[\]/)
assert.match(rules, /affectedKeys\(\)\.hasOnly\(\['email', 'displayName', 'updatedAt'\]\)/)
assert.doesNotMatch(rules, /request\.resource\.data\.plan in \['basic', 'pro'\]/)

console.log('firestore.rules checks passed')
