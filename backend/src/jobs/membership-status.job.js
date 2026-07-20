import cron from 'node-cron'
import { env } from '../config/env.js'
import { GymMember, Notification } from '../models/tfc.models.js'

export async function updateMembershipStatuses() {
  const now = new Date()
  const expiringSoonDate = new Date(now)
  expiringSoonDate.setDate(now.getDate() + env.RENEWAL_REMINDER_DAYS)

  const expiringMembers = await GymMember.find({
    isDeleted: false,
    membershipStatus: 'ACTIVE',
    membershipExpiryDate: { $gte: now, $lte: expiringSoonDate },
  })
    .select('_id userId fullName membershipExpiryDate')
    .lean()
    .exec()

  await GymMember.updateMany(
    { _id: { $in: expiringMembers.map((member) => member._id) } },
    { membershipStatus: 'EXPIRING_SOON' },
  ).exec()

  await GymMember.updateMany(
    { isDeleted: false, membershipExpiryDate: { $lt: now }, membershipStatus: { $nin: ['EXPIRED', 'CANCELLED'] } },
    { membershipStatus: 'EXPIRED', paymentStatus: 'OVERDUE' },
  ).exec()

  const notifications = expiringMembers
    .filter((member) => member.userId)
    .map((member) => ({
      userId: member.userId,
      type: 'MEMBERSHIP_EXPIRING_SOON',
      title: 'Membership expiring soon',
      message: `${member.fullName}'s membership expires on ${member.membershipExpiryDate.toDateString()}.`,
      channels: ['IN_APP', 'EMAIL'],
    }))

  if (notifications.length > 0) {
    await Notification.insertMany(notifications, { ordered: false })
  }

  return { expiringSoon: expiringMembers.length }
}

export function startMembershipStatusJob() {
  cron.schedule('10 2 * * *', () => {
    updateMembershipStatuses().catch((error) => {
      console.error('Membership status job failed', error)
    })
  })
}
