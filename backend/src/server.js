import { app } from './app.js'
import {
  connectToDatabase,
  disconnectFromDatabase,
} from './config/database.js'
import { env } from './config/env.js'
import { startMembershipStatusJob } from './jobs/membership-status.job.js'

async function start() {
  await connectToDatabase()
  startMembershipStatusJob()

  const server = app.listen(env.PORT, () => {
    console.log(`GymFlow API listening on http://localhost:${env.PORT}`)
  })

  async function shutdown(signal) {
    console.log(`${signal} received; shutting down`)
    server.close(async () => {
      await disconnectFromDatabase()
      process.exit(0)
    })
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
}

start().catch((error) => {
  console.error('Failed to start GymFlow API', error)
  process.exit(1)
})
