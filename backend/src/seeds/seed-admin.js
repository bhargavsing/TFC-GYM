import bcrypt from 'bcryptjs'
import { connectToDatabase, disconnectFromDatabase } from '../config/database.js'
import { env } from '../config/env.js'
import { Admin } from '../models/tfc.models.js'

async function seedAdmin() {
  await connectToDatabase()

  const passwordHash = await bcrypt.hash(env.ADMIN_SEED_PASSWORD, 12)
  const admin = await Admin.findOneAndUpdate(
    { username: env.ADMIN_SEED_USERNAME.toLowerCase() },
    {
      name: env.ADMIN_SEED_NAME,
      username: env.ADMIN_SEED_USERNAME.toLowerCase(),
      passwordHash,
      role: 'admin',
      isActive: true,
    },
    { upsert: true, returnDocument: 'after' },
  )
    .select('name username role isActive')
    .lean()
    .exec()

  console.log('Admin seed complete')
  console.log(`Admin username: ${admin.username}`)
}

seedAdmin()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await disconnectFromDatabase()
  })
