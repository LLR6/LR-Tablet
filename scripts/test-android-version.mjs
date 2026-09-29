import assert from 'node:assert/strict'
import { androidVersionCode, parseSemver } from './android-version.mjs'

assert.deepEqual(parseSemver('1.1.0'), { major: 1, minor: 1, patch: 0 })
assert.deepEqual(parseSemver('2.4.3-beta.1'), { major: 2, minor: 4, patch: 3 })
assert.equal(androidVersionCode('1.1.0'), 1_001_000)
assert.equal(androidVersionCode('2.4.3'), 2_004_003)
assert.throws(() => parseSemver('v1.2.3'), /unsupported semantic version/)
assert.throws(() => androidVersionCode('1.1000.0'), /below 1000/)

console.log('Android version mapping tests passed')
