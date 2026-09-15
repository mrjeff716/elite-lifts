import mongoose from 'mongoose'
import dotenv from 'dotenv'
import dns from 'node:dns'

dns.setServers(['8.8.8.8'])

dotenv.config()

export default async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('CONNECTION TO DB SUCCESSFUL')
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}