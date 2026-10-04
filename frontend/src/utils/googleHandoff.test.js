import test from 'node:test'
import assert from 'node:assert/strict'
import { webcrypto, createHash } from 'node:crypto'
import { createGoogleHandoff, parseGoogleReturn } from './googleHandoff.js'

function setup(exchange = async () => {}) {
  const values = new Map()
  const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
  const options = { storage, cryptoApi: webcrypto, exchange }
  return { client: createGoogleHandoff(options), values, options }
}
const code = 'c'.repeat(43)
const callback = state => `https://myelitelifts.vercel.app/open/?code=${code}&state=${state}`

test('only exact configured callback destinations are accepted', () => {
  for (const url of ['https://evil.example/open/', 'https://myelitelifts.vercel.app.evil.example/open/', 'http://myelitelifts.vercel.app/open/', 'https://myelitelifts.vercel.app/open/extra', 'elitelifts://evil/', 'not a url']) {
    assert.equal(parseGoogleReturn(url), null)
  }
  assert.ok(parseGoogleReturn('https://myelitelifts.vercel.app/open/'))
  assert.ok(parseGoogleReturn('elitelifts://open/'))
})

test('secret remains in app storage; cold-start callbacks exchange once even with duplicate events', async () => {
  const requests = []
  const { client, values, options } = setup(async body => { requests.push(body) })
  const params = await client.start()
  const pending = JSON.parse([...values.values()][0])
  assert.equal(params.get('code_challenge'), createHash('sha256').update(pending.verifier).digest('base64url'))
  assert.ok(!params.toString().includes(pending.verifier))
  const restarted = createGoogleHandoff(options)
  const url = callback(params.get('app_state'))
  const outcomes = await Promise.all([restarted.finish(url), restarted.finish(url)])
  assert.deepEqual(outcomes, [{ authenticated: true }, { authenticated: true }])
  assert.deepEqual(requests, [{ code, verifier: pending.verifier }])
  assert.equal(values.size, 0)
})

test('foreign/missing state cannot exchange or destroy the active attempt', async () => {
  let calls = 0
  const { client, values } = setup(async () => { calls++ })
  await client.start()
  assert.equal(await client.finish(callback('x'.repeat(43))), null)
  assert.equal(await client.finish(`https://myelitelifts.vercel.app/open/?code=${code}`), null)
  assert.equal(calls, 0)
  assert.equal(values.size, 1)
})

test('expired attempts, cancellation and failed exchanges clear secrets and show retry errors', async () => {
  const { client, values } = setup()
  const params = await client.start()
  const [key, json] = [...values.entries()][0]
  values.set(key, JSON.stringify({ ...JSON.parse(json), expiresAt: Date.now() - 1 }))
  assert.deepEqual(await client.finish(callback(params.get('app_state'))), { error: 'google_handoff_failed' })
  assert.equal(values.size, 0)
  const cancelParams = await client.start()
  assert.deepEqual(await client.finish(`elitelifts://open/?error=google_cancelled&state=${cancelParams.get('app_state')}`), { error: 'google_cancelled' })
  assert.equal(values.size, 0)
  const failing = setup(async () => { throw new Error('network failure') })
  const failureParams = await failing.client.start()
  assert.deepEqual(await failing.client.finish(callback(failureParams.get('app_state'))), { error: 'google_handoff_failed' })
  assert.equal(failing.values.size, 0)
})
