import mongoose from 'mongoose'

const loginHandoffSchema = new mongoose.Schema({
  codeHash: { type: String, required: true, unique: true },
  codeChallenge: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
})

export default mongoose.model('LoginHandoff', loginHandoffSchema)
