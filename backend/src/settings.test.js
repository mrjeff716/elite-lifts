import test from 'node:test'
import assert from 'node:assert/strict'
import User from './models/User.js'
import { updateUser } from './controllers/userControllers.js'

test('settings saves the preference and waits for persistence before responding', async (t) => {
  const user = new User({ name: 'Test', email: 'test@example.com' })
  let finishSave
  const pendingSave = new Promise(resolve => { finishSave = resolve })
  let savedPreference
  t.mock.method(User, 'findById', async () => user)
  t.mock.method(user, 'save', async () => {
    await user.validate()
    await pendingSave
    savedPreference = user.workoutPreference
  })
  let response
  let failure
  const res = { status(code) { assert.equal(code, 201); return this }, json(body) { response = body } }
  const request = updateUser({ body: {
    id: user.id, name: user.name, email: user.email, workouts: [],
    weightUnit: 'kg', workoutsPerWeek: 3, workoutPreference: 'Muscle strength',
  } }, res, error => { failure = error })
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(response, undefined)
  finishSave()
  await request
  assert.equal(failure, undefined)
  assert.equal(savedPreference, 'Muscle strength')
  assert.equal(response.user.workoutPreference, 'Muscle strength')
})

test('settings handles absent, blank and invalid preferences and save failures', async (t) => {
  const user = new User({ name: 'Test', email: 'test@example.com', workoutPreference: 'Mobility' })
  t.mock.method(User, 'findById', async () => user)
  const save = t.mock.method(user, 'save', async () => user.validate())
  const body = { id: user.id, name: user.name, email: user.email, workouts: [], weightUnit: 'kg' }
  let response
  let failure
  const res = { status() { return this }, json(value) { response = value } }
  const next = error => { failure = error }
  await updateUser({ body }, res, next)
  assert.equal(user.workoutPreference, 'Mobility')
  assert.equal(failure, undefined)
  await updateUser({ body: { ...body, workoutPreference: '' } }, res, next)
  assert.equal(user.workoutPreference, undefined)
  assert.equal(failure, undefined)
  response = undefined
  await updateUser({ body: { ...body, workoutPreference: 'invalid' } }, res, next)
  assert.equal(failure.name, 'ValidationError')
  assert.equal(response, undefined)
  const databaseError = new Error('Database unavailable')
  save.mock.mockImplementation(async () => { throw databaseError })
  await updateUser({ body: { ...body, workoutPreference: 'Mobility' } }, res, next)
  assert.equal(failure, databaseError)
  assert.equal(response, undefined)
})
