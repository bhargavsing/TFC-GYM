import { Member } from './member.model.js'
import { HttpError } from '../common/http-error.js'

function oneMonthAfter(date) {
  const end = new Date(date ?? Date.now())
  end.setMonth(end.getMonth() + 1)
  return end
}

function toMemberResponse(member) {
  const membershipStart = member.membershipStart ?? member.joinedAt ?? new Date()

  return {
    id: member._id.toString(),
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone,
    status: member.status ?? 'ACTIVE',
    plan: member.plan ?? 'STANDARD',
    paymentStatus: member.paymentStatus ?? 'DUE',
    membershipStart,
    membershipEnd: member.membershipEnd ?? oneMonthAfter(membershipStart),
    lastPaymentAmount: member.lastPaymentAmount ?? 0,
    lastPaymentDate: member.lastPaymentDate,
    trainer: member.trainer ?? '',
    goal: member.goal ?? '',
    emergencyContact: member.emergencyContact ?? { name: '', phone: '' },
    notes: member.notes ?? '',
    joinedAt: member.joinedAt,
  }
}

export async function createMember(input) {
  const member = await Member.create(input)
  return toMemberResponse(member)
}

export async function findAllMembers() {
  const members = await Member.find().sort({ joinedAt: -1 }).lean().exec()
  return members.map(toMemberResponse)
}

export async function updateMember(id, input) {
  const member = await Member.findByIdAndUpdate(id, input, {
    returnDocument: 'after',
    runValidators: true,
  })
    .lean()
    .exec()

  if (!member) {
    throw new HttpError(404, `Member ${id} not found`)
  }

  return toMemberResponse(member)
}

export async function deleteMember(id) {
  const result = await Member.findByIdAndDelete(id).lean().exec()

  if (!result) {
    throw new HttpError(404, `Member ${id} not found`)
  }
}

export async function getMemberDashboard() {
  const now = new Date()
  const thirtyDaysFromNow = new Date(now)
  thirtyDaysFromNow.setDate(now.getDate() + 30)

  const [members, expiringSoon] = await Promise.all([
    Member.find().lean().exec(),
    Member.find({
      status: 'ACTIVE',
      membershipEnd: { $gte: now, $lte: thirtyDaysFromNow },
    })
      .sort({ membershipEnd: 1 })
      .limit(6)
      .lean()
      .exec(),
  ])

  const totals = members.reduce(
    (summary, member) => {
      summary.totalMembers += 1
      summary.revenue += Number(member.lastPaymentAmount ?? 0)
      summary.byStatus[member.status] = (summary.byStatus[member.status] ?? 0) + 1
      summary.byPaymentStatus[member.paymentStatus] =
        (summary.byPaymentStatus[member.paymentStatus] ?? 0) + 1
      summary.byPlan[member.plan] = (summary.byPlan[member.plan] ?? 0) + 1

      if (member.membershipEnd && new Date(member.membershipEnd) < now) {
        summary.expiredMembers += 1
      }

      return summary
    },
    {
      totalMembers: 0,
      expiredMembers: 0,
      revenue: 0,
      byStatus: {},
      byPaymentStatus: {},
      byPlan: {},
    },
  )

  return {
    ...totals,
    expiringSoon: expiringSoon.map(toMemberResponse),
  }
}
