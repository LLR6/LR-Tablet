import assert from 'node:assert/strict'
import { createBackupEnvelope, sha256Hex, stableStringify, validateBackupEnvelope, validateStoreShape } from '../src/backup.js'

const data = {
  version: 1,
  customExercises: [],
  attempts: [],
  plan: { dailyArticles: 2 },
  settings: { theme: 'cream' },
}

assert.equal(stableStringify({ b: 2, a: 1 }), stableStringify({ a: 1, b: 2 }))
assert.equal((await sha256Hex(data)).length, 64)

const envelope = await createBackupEnvelope(data, '2026-09-29T00:00:00Z')
const checked = await validateBackupEnvelope(envelope)
assert.equal(checked.integrity, 'verified')
assert.deepEqual(validateStoreShape(checked.data), data)

const tampered = structuredClone(envelope)
tampered.data.attempts.push({ id: 'changed' })
await assert.rejects(() => validateBackupEnvelope(tampered), /完整性校验失败/)

const legacy = await validateBackupEnvelope({ data })
assert.equal(legacy.integrity, 'legacy-unverified')

console.log('Backup integrity tests passed')
