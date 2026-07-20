import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { HttpError } from '../common/http-error.js'
import { adminOnly, authenticate, customerOnly, partnerOnly, superAdminOnly } from '../auth/auth.middleware.js'
import { env } from '../config/env.js'
import { audit } from '../services/audit.service.js'
import { nextSequence, nextYearSequence } from '../services/id.service.js'
import {
  Attendance,
  Admin,
  Feedback,
  GymMember,
  Membership,
  MembershipPlan,
  Notification,
  PartnerLedger,
  PartnerSettlement,
  Payment,
  SettlementItem,
  SlotLock,
  Turf,
  TurfBooking,
  TurfPartner,
  TurfSlot,
  User,
  WebsiteContent,
} from '../models/tfc.models.js'

export const tfcRouter = Router()

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'production' ? 20 : env.ADMIN_LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    type: 'about:blank',
    title: 'Too many login attempts',
    status: 429,
    detail: 'Too many admin login attempts. Please wait a few minutes or restart the backend in development.',
  },
})

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a MongoDB ObjectId')
const dateString = z.string().pipe(z.coerce.date())
const money = z.coerce.number().min(0)

const planSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional(),
  durationDays: z.coerce.number().int().positive(),
  originalPrice: money,
  discountedPrice: money,
  tax: money.optional(),
  registrationFee: money.optional(),
  personalTrainingFee: money.optional(),
  includedFacilities: z.array(z.string().trim()).default([]),
  isActive: z.boolean().optional(),
  displayOrder: z.coerce.number().int().optional(),
})

const gymMemberSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.email().trim().toLowerCase(),
  phone: z.string().trim().min(8),
  membershipPlanId: objectId.optional(),
  membershipStartDate: dateString,
  membershipExpiryDate: dateString,
  paymentStatus: z.enum(['PAID', 'PARTIALLY_PAID', 'PENDING', 'OVERDUE', 'REFUNDED', 'FAILED']).default('PENDING'),
  membershipStatus: z
    .enum(['ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'FROZEN', 'CANCELLED', 'PENDING_ACTIVATION'])
    .default('PENDING_ACTIVATION'),
  emergencyContact: z.object({ name: z.string().optional(), phone: z.string().optional(), relation: z.string().optional() }).optional(),
  assignedTrainer: z.string().optional(),
  healthNotes: z.string().optional(),
  internalAdminNotes: z.string().optional(),
  sourceOfRegistration: z.string().optional(),
  outstandingAmount: money.optional(),
})

const turfSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().optional(),
  images: z.array(z.string()).default([]),
  location: z.object({ address: z.string().optional(), mapUrl: z.string().optional() }).optional(),
  supportedSports: z.array(z.enum(['CRICKET', 'FOOTBALL', 'BADMINTON', 'OTHER'])).default(['FOOTBALL', 'CRICKET']),
  openingTime: z.string().default('06:00'),
  closingTime: z.string().default('23:00'),
  slotDurationMinutes: z.coerce.number().int().positive().default(60),
  weekdayPrice: money.default(1000),
  weekendPrice: money.default(1400),
  holidayPrice: money.default(1600),
  peakHourPrice: money.default(1800),
  perPersonPrice: money.default(100),
  minBookingMinutes: z.coerce.number().int().positive().default(60),
  maxBookingMinutes: z.coerce.number().int().positive().default(180),
  advanceBookingDays: z.coerce.number().int().positive().default(30),
  cancellationPolicy: z.string().optional(),
})

const bookingSchema = z.object({
  turfId: objectId,
  sport: z.string().trim().min(2),
  startAt: dateString,
  endAt: dateString,
  players: z.coerce.number().int().positive().default(1),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
  lockToken: z.string().optional(),
})

const feedbackSchema = z.object({
  name: z.string().trim().optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  category: z.enum([
    'GYM_EQUIPMENT',
    'CLEANLINESS',
    'STAFF_BEHAVIOUR',
    'TRAINER_SUPPORT',
    'MEMBERSHIP_PRICING',
    'TURF_QUALITY',
    'BOOKING_EXPERIENCE',
    'WEBSITE_EXPERIENCE',
    'OTHER',
  ]),
  rating: z.coerce.number().int().min(1).max(5),
  message: z.string().trim().min(5),
  suggestions: z.string().optional(),
  anonymous: z.boolean().default(false),
})

const partnerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email().trim().toLowerCase(),
  phone: z.string().optional(),
  address: z.string().optional(),
  ownershipPercentage: z.coerce.number().min(0).max(100),
  profitSharingPercentage: z.coerce.number().min(0).max(100),
  notes: z.string().optional(),
})

const adminLoginSchema = z.object({
  username: z.string().trim().min(2).max(80),
  password: z.string().min(8).max(128),
})

const turfSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^([01]\d|2[0-3]):00$/),
  endTime: z.string().regex(/^(([01]\d|2[0-3]):00|00:00)$/),
  status: z.enum(['available', 'booked', 'blocked']).default('available'),
  price: money.default(800),
  bookingName: z.string().trim().max(120).optional().or(z.literal('')),
  bookingPhone: z.string().trim().max(30).optional().or(z.literal('')),
  bookingReference: z.string().trim().max(120).optional().or(z.literal('')),
  adminNote: z.string().trim().max(600).optional().or(z.literal('')),
})

function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
    path: '/api',
    maxAge: 8 * 60 * 60 * 1000,
  }
}

function toAdminResponse(admin) {
  return {
    id: admin._id.toString(),
    name: admin.name,
    username: admin.username,
    role: admin.role,
    isActive: admin.isActive,
    lastLoginAt: admin.lastLoginAt,
  }
}

function normalizeDate(dateInput) {
  const date = new Date(`${dateInput}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, 'Invalid date')
  }
  return date
}

function hourLabel(hour) {
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const value = hour % 12 === 0 ? 12 : hour % 12
  return `${value}:00 ${suffix}`
}

function buildHourlySlots(dateInput, savedSlots = []) {
  const savedByTime = new Map(savedSlots.map((slot) => [`${slot.startTime}-${slot.endTime}`, slot]))
  const now = new Date()

  return Array.from({ length: 24 }, (_, hour) => {
    const startTime = `${String(hour).padStart(2, '0')}:00`
    const endTime = `${String((hour + 1) % 24).padStart(2, '0')}:00`
    const saved = savedByTime.get(`${startTime}-${endTime}`)
    const startsAt = new Date(`${dateInput}T${startTime}:00.000`)

    return {
      id: saved?._id?.toString(),
      date: dateInput,
      startTime,
      endTime,
      label: `${hourLabel(hour)}-${hourLabel((hour + 1) % 24)}`,
      status: saved?.status ?? 'available',
      price: saved?.price ?? 800,
      isPast: startsAt < now,
      bookingName: saved?.bookingName,
      bookingPhone: saved?.bookingPhone,
      bookingReference: saved?.bookingReference,
      adminNote: saved?.adminNote,
    }
  })
}

function toPublicSlot(slot) {
  return {
    id: slot.id,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    label: slot.label,
    status: slot.status,
    price: slot.price,
    isPast: slot.isPast,
  }
}

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

async function ensureNoBookingConflict({ turfId, startAt, endAt }) {
  const conflict = await TurfBooking.findOne({
    turfId,
    status: { $nin: ['CANCELLED', 'REFUNDED', 'NO_SHOW'] },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  })
    .lean()
    .exec()

  if (conflict) throw new HttpError(409, 'This turf slot is already booked')
}

function calculateBookingTotal(turf, startAt) {
  const day = startAt.getDay()
  const isWeekend = day === 0 || day === 6
  const base = isWeekend ? turf.weekendPrice : turf.weekdayPrice
  const tax = 0
  return { base, tax, discount: 0, total: base + tax }
}

tfcRouter.post('/admin/login', adminLoginLimiter, async (request, response, next) => {
  try {
    const input = adminLoginSchema.parse(request.body)
    const admin = await Admin.findOne({ username: input.username.toLowerCase() })
      .select('+passwordHash')
      .exec()

    if (!admin || !(await bcrypt.compare(input.password, admin.passwordHash))) {
      throw new HttpError(401, 'Invalid username or password')
    }

    if (!admin.isActive) {
      throw new HttpError(403, 'Admin account is inactive')
    }

    admin.lastLoginAt = new Date()
    await admin.save()

    const accessToken = jwt.sign(
      { sub: admin._id.toString(), type: 'admin', role: 'admin' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN },
    )

    response.cookie('tfc_admin_token', accessToken, adminCookieOptions())
    response.json({ accessToken, admin: toAdminResponse(admin) })
  } catch (error) {
    next(error)
  }
})

tfcRouter.post('/admin/logout', (_request, response) => {
  response.clearCookie('tfc_admin_token', adminCookieOptions())
  response.status(204).send()
})

tfcRouter.get('/admin/me', ...adminOnly, (request, response) => {
  response.json({
    id: request.user.id,
    name: request.user.name,
    username: request.user.username,
    role: request.user.role,
  })
})

tfcRouter.get('/turf-slots', async (request, response, next) => {
  try {
    const input = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(request.query)
    const date = normalizeDate(input.date)
    const savedSlots = await TurfSlot.find({ date }).lean().exec()
    response.json({ date: input.date, slots: buildHourlySlots(input.date, savedSlots).map(toPublicSlot) })
  } catch (error) {
    next(error)
  }
})

tfcRouter.post('/admin/turf-slots/generate-day', ...adminOnly, async (request, response, next) => {
  try {
    const input = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(request.body)
    const date = normalizeDate(input.date)
    const operations = Array.from({ length: 24 }, (_, hour) => {
      const startTime = `${String(hour).padStart(2, '0')}:00`
      const endTime = `${String((hour + 1) % 24).padStart(2, '0')}:00`
      return {
        updateOne: {
          filter: { date, startTime, endTime },
          update: { $setOnInsert: { date, startTime, endTime, status: 'available', price: 800 } },
          upsert: true,
        },
      }
    })

    await TurfSlot.bulkWrite(operations, { ordered: false })
    const savedSlots = await TurfSlot.find({ date }).lean().exec()
    response.status(201).json({ date: input.date, slots: buildHourlySlots(input.date, savedSlots) })
  } catch (error) {
    next(error)
  }
})

tfcRouter.post('/admin/turf-slots/upsert', ...adminOnly, async (request, response, next) => {
  try {
    const input = turfSlotSchema.parse(request.body)
    const slot = await TurfSlot.findOneAndUpdate(
      {
        date: normalizeDate(input.date),
        startTime: input.startTime,
        endTime: input.endTime,
      },
      {
        ...input,
        date: normalizeDate(input.date),
        updatedBy: request.user.id,
        ...(input.status === 'available'
          ? { bookingName: '', bookingPhone: '', bookingReference: '', adminNote: '' }
          : {}),
      },
      { upsert: true, returnDocument: 'after', runValidators: true },
    )
      .lean()
      .exec()
    response.status(201).json(slot)
  } catch (error) {
    next(error)
  }
})

tfcRouter.put('/admin/turf-slots/:id', ...adminOnly, async (request, response, next) => {
  try {
    const input = turfSlotSchema.omit({ date: true, startTime: true, endTime: true }).partial().parse(request.body)
    const slot = await TurfSlot.findByIdAndUpdate(
      request.params.id,
      {
        ...input,
        updatedBy: request.user.id,
        ...(input.status === 'available'
          ? { bookingName: '', bookingPhone: '', bookingReference: '', adminNote: '' }
          : {}),
      },
      { returnDocument: 'after', runValidators: true },
    )
      .lean()
      .exec()

    if (!slot) {
      throw new HttpError(404, 'Turf slot not found')
    }

    response.json(slot)
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/public/home', async (_request, response, next) => {
  try {
    const [content, plans, turfs] = await Promise.all([
      WebsiteContent.findOne({ key: 'home' }).lean().exec(),
      MembershipPlan.find({ isActive: true, isDeleted: false }).sort({ displayOrder: 1 }).lean().exec(),
      Turf.find({ isActive: true, isDeleted: false }).lean().exec(),
    ])
    response.json({
      content: content?.content ?? {
        brand: 'TFC Gym & Turf',
        tagline: 'Train hard. Play harder.',
        contact: { phone: '+91 98765 43210', email: 'hello@tfc.local', address: 'Jawahar Nagar, near Jeewan Ganga Banquet Hall' },
      },
      plans,
      turfs,
    })
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/membership-plans', async (_request, response, next) => {
  try {
    response.json(await MembershipPlan.find({ isActive: true, isDeleted: false }).sort({ displayOrder: 1 }).lean().exec())
  } catch (error) {
    next(error)
  }
})

tfcRouter.post('/admin/membership-plans', ...adminOnly, async (request, response, next) => {
  try {
    const plan = await MembershipPlan.create(planSchema.parse(request.body))
    await audit(request, 'MEMBERSHIP_PLAN_CREATED', 'MembershipPlan', plan._id, { newValues: plan.toObject() })
    response.status(201).json(plan)
  } catch (error) {
    next(error)
  }
})

tfcRouter.patch('/admin/membership-plans/:planId', ...adminOnly, async (request, response, next) => {
  try {
    const plan = await MembershipPlan.findByIdAndUpdate(request.params.planId, planSchema.partial().parse(request.body), {
      returnDocument: 'after',
      runValidators: true,
    }).lean().exec()
    if (!plan) throw new HttpError(404, 'Membership plan not found')
    await audit(request, 'MEMBERSHIP_PLAN_UPDATED', 'MembershipPlan', request.params.planId, { newValues: plan })
    response.json(plan)
  } catch (error) {
    next(error)
  }
})

tfcRouter.delete('/admin/membership-plans/:planId', ...adminOnly, async (request, response, next) => {
  try {
    await MembershipPlan.findByIdAndUpdate(request.params.planId, { isDeleted: true, deletedAt: new Date() }).exec()
    await audit(request, 'MEMBERSHIP_PLAN_DELETED', 'MembershipPlan', request.params.planId)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/admin/members', ...adminOnly, async (request, response, next) => {
  try {
    const { q, status, paymentStatus, sort = '-createdAt' } = request.query
    const filter = { isDeleted: false }
    if (status) filter.membershipStatus = status
    if (paymentStatus) filter.paymentStatus = paymentStatus
    if (q) filter.$text = { $search: q }
    response.json(await GymMember.find(filter).sort(sort).lean().exec())
  } catch (error) {
    next(error)
  }
})

tfcRouter.post('/admin/members', ...adminOnly, async (request, response, next) => {
  try {
    const input = gymMemberSchema.parse(request.body)
    const member = await GymMember.create({
      ...input,
      memberId: await nextSequence('gym-member', 'TFC-GYM-'),
      createdBy: request.user.id,
      lastUpdatedBy: request.user.id,
    })
    await Membership.create({
      memberId: member._id,
      planId: member.membershipPlanId,
      startDate: member.membershipStartDate,
      expiryDate: member.membershipExpiryDate,
      status: member.membershipStatus,
      outstandingBalance: member.outstandingAmount,
      createdBy: request.user.id,
    })
    await audit(request, 'MEMBER_CREATED', 'GymMember', member._id, { newValues: member.toObject() })
    response.status(201).json(member)
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/admin/members/:memberId', ...adminOnly, async (request, response, next) => {
  try {
    const member = await GymMember.findById(request.params.memberId).lean().exec()
    if (!member) throw new HttpError(404, 'Member not found')
    response.json(member)
  } catch (error) {
    next(error)
  }
})

tfcRouter.patch('/admin/members/:memberId', ...adminOnly, async (request, response, next) => {
  try {
    const member = await GymMember.findByIdAndUpdate(
      request.params.memberId,
      { ...gymMemberSchema.partial().parse(request.body), lastUpdatedBy: request.user.id },
      { returnDocument: 'after', runValidators: true },
    ).lean().exec()
    if (!member) throw new HttpError(404, 'Member not found')
    await audit(request, 'MEMBER_UPDATED', 'GymMember', request.params.memberId, { newValues: member })
    response.json(member)
  } catch (error) {
    next(error)
  }
})

tfcRouter.patch('/admin/members/:memberId/status', ...adminOnly, async (request, response, next) => {
  try {
    const input = z.object({ membershipStatus: gymMemberSchema.shape.membershipStatus }).parse(request.body)
    const member = await GymMember.findByIdAndUpdate(request.params.memberId, input, { returnDocument: 'after' }).lean().exec()
    if (!member) throw new HttpError(404, 'Member not found')
    await audit(request, 'MEMBER_STATUS_CHANGED', 'GymMember', request.params.memberId, { newValues: input })
    response.json(member)
  } catch (error) {
    next(error)
  }
})

tfcRouter.post('/admin/members/:memberId/renew', ...adminOnly, async (request, response, next) => {
  try {
    const input = z.object({ planId: objectId, startDate: dateString.optional() }).parse(request.body)
    const plan = await MembershipPlan.findById(input.planId).lean().exec()
    if (!plan) throw new HttpError(404, 'Plan not found')
    const startDate = input.startDate ?? new Date()
    const expiryDate = new Date(startDate)
    expiryDate.setDate(expiryDate.getDate() + plan.durationDays)
    const member = await GymMember.findByIdAndUpdate(
      request.params.memberId,
      {
        membershipPlanId: plan._id,
        membershipStartDate: startDate,
        membershipExpiryDate: expiryDate,
        membershipStatus: 'ACTIVE',
        paymentStatus: 'PENDING',
        outstandingAmount: plan.discountedPrice + plan.tax + plan.registrationFee,
      },
      { returnDocument: 'after' },
    ).lean().exec()
    if (!member) throw new HttpError(404, 'Member not found')
    await Membership.create({ memberId: member._id, planId: plan._id, startDate, expiryDate, status: 'ACTIVE', renewalAmount: plan.discountedPrice })
    await audit(request, 'MEMBERSHIP_RENEWED', 'GymMember', request.params.memberId, { newValues: { planId: plan._id, expiryDate } })
    response.json(member)
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/admin/members/:memberId/payments', ...adminOnly, async (request, response, next) => {
  try {
    response.json(await Payment.find({ memberId: request.params.memberId }).sort({ createdAt: -1 }).lean().exec())
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/admin/members/:memberId/attendance', ...adminOnly, async (request, response, next) => {
  try {
    response.json(await Attendance.find({ memberId: request.params.memberId }).sort({ checkInAt: -1 }).lean().exec())
  } catch (error) {
    next(error)
  }
})

tfcRouter.post('/admin/attendance/check-in', ...adminOnly, async (request, response, next) => {
  try {
    const input = z.object({ memberId: objectId, overrideReason: z.string().optional() }).parse(request.body)
    const attendance = await Attendance.create({
      memberId: input.memberId,
      dayKey: dayKey(),
      overrideReason: input.overrideReason,
      recordedBy: request.user.id,
    })
    await audit(request, 'MEMBER_CHECKED_IN', 'Attendance', attendance._id, { newValues: attendance.toObject() })
    response.status(201).json(attendance)
  } catch (error) {
    next(error)
  }
})

tfcRouter.post('/admin/attendance/:attendanceId/check-out', ...adminOnly, async (request, response, next) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(request.params.attendanceId, { checkOutAt: new Date() }, { returnDocument: 'after' }).lean().exec()
    if (!attendance) throw new HttpError(404, 'Attendance record not found')
    response.json(attendance)
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/admin/attendance', ...adminOnly, async (_request, response, next) => {
  try {
    response.json(await Attendance.find({ dayKey: dayKey() }).populate('memberId', 'fullName memberId phone').lean().exec())
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/turfs', async (_request, response, next) => {
  try {
    response.json(await Turf.find({ isActive: true, isDeleted: false }).lean().exec())
  } catch (error) {
    next(error)
  }
})

tfcRouter.post('/admin/turfs', ...adminOnly, async (request, response, next) => {
  try {
    const turf = await Turf.create(turfSchema.parse(request.body))
    await audit(request, 'TURF_CREATED', 'Turf', turf._id, { newValues: turf.toObject() })
    response.status(201).json(turf)
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/turfs/:turfId/availability', async (request, response, next) => {
  try {
    const input = z.object({ date: dateString }).parse(request.query)
    const turf = await Turf.findById(request.params.turfId).lean().exec()
    if (!turf) throw new HttpError(404, 'Turf not found')
    const startOfDay = new Date(input.date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(endOfDay.getDate() + 1)
    const [bookings, locks] = await Promise.all([
      TurfBooking.find({ turfId: turf._id, startAt: { $gte: startOfDay, $lt: endOfDay }, status: { $nin: ['CANCELLED', 'REFUNDED'] } }).lean().exec(),
      SlotLock.find({ turfId: turf._id, startAt: { $gte: startOfDay, $lt: endOfDay }, expiresAt: { $gt: new Date() } }).lean().exec(),
    ])
    response.json({ turf, bookings, locks })
  } catch (error) {
    next(error)
  }
})

tfcRouter.post('/turf-bookings/lock', authenticate, async (request, response, next) => {
  try {
    const input = bookingSchema.pick({ turfId: true, startAt: true, endAt: true }).parse(request.body)
    await ensureNoBookingConflict(input)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    const lock = await SlotLock.create({ ...input, customerId: request.user.id, expiresAt, token: crypto.randomUUID() })
    response.status(201).json(lock)
  } catch (error) {
    next(error)
  }
})

tfcRouter.post('/turf-bookings', authenticate, async (request, response, next) => {
  try {
    const input = bookingSchema.parse(request.body)
    await ensureNoBookingConflict(input)
    const turf = await Turf.findById(input.turfId).lean().exec()
    if (!turf) throw new HttpError(404, 'Turf not found')
    if (input.lockToken) {
      const lock = await SlotLock.findOne({ token: input.lockToken, expiresAt: { $gt: new Date() } }).lean().exec()
      if (!lock) throw new HttpError(409, 'Slot lock expired')
    }
    const booking = await TurfBooking.create({
      ...input,
      customerId: request.user.id,
      bookingId: await nextYearSequence('turf-booking', 'TFC-TURF-'),
      priceBreakdown: calculateBookingTotal(turf, input.startAt),
    })
    response.status(201).json(booking)
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/turf-bookings/my', ...customerOnly, async (request, response, next) => {
  try {
    response.json(await TurfBooking.find({ customerId: request.user.id }).sort({ startAt: -1 }).lean().exec())
  } catch (error) {
    next(error)
  }
})

tfcRouter.patch('/turf-bookings/:bookingId/cancel', authenticate, async (request, response, next) => {
  try {
    const booking = await TurfBooking.findOneAndUpdate(
      { _id: request.params.bookingId, $or: [{ customerId: request.user.id }, { customerId: { $exists: true } }] },
      { status: 'CANCELLED' },
      { returnDocument: 'after' },
    ).lean().exec()
    if (!booking) throw new HttpError(404, 'Booking not found')
    response.json(booking)
  } catch (error) {
    next(error)
  }
})

tfcRouter.post('/payments/create-order', authenticate, async (request, response, next) => {
  try {
    const input = z.object({ purpose: z.string(), amount: money, method: z.enum(['RAZORPAY', 'STRIPE']).default('RAZORPAY') }).parse(request.body)
    const payment = await Payment.create({
      ...input,
      finalAmount: input.amount,
      status: 'PENDING',
      userId: request.user.id,
      internalPaymentId: await nextSequence('payment', 'TFC-PAY-'),
      gatewayOrderId: `test_${crypto.randomUUID()}`,
    })
    response.status(201).json(payment)
  } catch (error) {
    next(error)
  }
})

tfcRouter.post('/payments/verify', authenticate, async (request, response, next) => {
  try {
    const input = z.object({ internalPaymentId: z.string(), gatewayPaymentId: z.string(), gatewaySignature: z.string() }).parse(request.body)
    const payment = await Payment.findOneAndUpdate(
      { internalPaymentId: input.internalPaymentId },
      { ...input, status: 'PAID', paidDate: new Date() },
      { returnDocument: 'after' },
    ).lean().exec()
    if (!payment) throw new HttpError(404, 'Payment not found')
    response.json(payment)
  } catch (error) {
    next(error)
  }
})

tfcRouter.post('/payments/webhook', async (request, response, next) => {
  try {
    const idempotencyKey = request.get('x-idempotency-key') ?? crypto.randomUUID()
    const existing = await Payment.findOne({ idempotencyKey }).lean().exec()
    if (existing) {
      response.json({ received: true, duplicate: true })
      return
    }
    await Payment.create({ purpose: 'WEBHOOK_EVENT', method: 'RAZORPAY', status: 'PENDING', idempotencyKey })
    response.json({ received: true })
  } catch (error) {
    next(error)
  }
})

tfcRouter.post('/admin/payments/manual', ...adminOnly, async (request, response, next) => {
  try {
    const input = z.object({
      memberId: objectId.optional(),
      bookingId: objectId.optional(),
      purpose: z.string(),
      amount: money,
      tax: money.optional(),
      discount: money.optional(),
      notes: z.string().optional(),
    }).parse(request.body)
    const finalAmount = input.amount + (input.tax ?? 0) - (input.discount ?? 0)
    const payment = await Payment.create({
      ...input,
      method: 'CASH',
      status: 'PAID',
      paidDate: new Date(),
      finalAmount,
      recordedBy: request.user.id,
      internalPaymentId: await nextSequence('payment', 'TFC-PAY-'),
    })
    await audit(request, 'MANUAL_PAYMENT_RECORDED', 'Payment', payment._id, { newValues: payment.toObject() })
    response.status(201).json(payment)
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/payments/my', ...customerOnly, async (request, response, next) => {
  try {
    response.json(await Payment.find({ userId: request.user.id }).sort({ createdAt: -1 }).lean().exec())
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/admin/payments', ...adminOnly, async (_request, response, next) => {
  try {
    response.json(await Payment.find().sort({ createdAt: -1 }).limit(200).lean().exec())
  } catch (error) {
    next(error)
  }
})

tfcRouter.post('/feedback', async (request, response, next) => {
  try {
    const feedback = await Feedback.create(feedbackSchema.parse(request.body))
    response.status(201).json(feedback)
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/feedback/my', authenticate, async (request, response, next) => {
  try {
    response.json(await Feedback.find({ userId: request.user.id }).sort({ createdAt: -1 }).lean().exec())
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/admin/feedback', ...adminOnly, async (_request, response, next) => {
  try {
    response.json(await Feedback.find().sort({ createdAt: -1 }).lean().exec())
  } catch (error) {
    next(error)
  }
})

tfcRouter.patch('/admin/feedback/:feedbackId', ...adminOnly, async (request, response, next) => {
  try {
    const input = z.object({
      status: z.enum(['NEW', 'UNDER_REVIEW', 'PLANNED', 'RESOLVED', 'REJECTED']).optional(),
      adminResponse: z.string().optional(),
      internalNotes: z.string().optional(),
    }).parse(request.body)
    const feedback = await Feedback.findByIdAndUpdate(request.params.feedbackId, input, { returnDocument: 'after' }).lean().exec()
    if (!feedback) throw new HttpError(404, 'Feedback not found')
    response.json(feedback)
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/admin/partners', ...superAdminOnly, async (_request, response, next) => {
  try {
    response.json(await TurfPartner.find({ isDeleted: false }).lean().exec())
  } catch (error) {
    next(error)
  }
})

tfcRouter.post('/admin/partners', ...superAdminOnly, async (request, response, next) => {
  try {
    const input = partnerSchema.parse(request.body)
    const totals = await TurfPartner.aggregate([
      { $match: { status: 'ACTIVE', isDeleted: false } },
      { $group: { _id: null, ownership: { $sum: '$ownershipPercentage' }, profit: { $sum: '$profitSharingPercentage' } } },
    ])
    if ((totals[0]?.ownership ?? 0) + input.ownershipPercentage > 100) {
      throw new HttpError(400, 'Total active partner ownership cannot exceed 100%')
    }
    const partner = await TurfPartner.create(input)
    await audit(request, 'PARTNER_CREATED', 'TurfPartner', partner._id, { newValues: partner.toObject() })
    response.status(201).json(partner)
  } catch (error) {
    next(error)
  }
})

tfcRouter.patch('/admin/partners/:partnerId', ...superAdminOnly, async (request, response, next) => {
  try {
    const partner = await TurfPartner.findByIdAndUpdate(request.params.partnerId, partnerSchema.partial().parse(request.body), {
      returnDocument: 'after',
      runValidators: true,
    }).lean().exec()
    if (!partner) throw new HttpError(404, 'Partner not found')
    await audit(request, 'PARTNER_UPDATED', 'TurfPartner', request.params.partnerId, { newValues: partner })
    response.json(partner)
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/partner/dashboard', ...partnerOnly, async (_request, response, next) => {
  try {
    const [ledger, settlements] = await Promise.all([
      PartnerLedger.find().sort({ createdAt: -1 }).limit(20).lean().exec(),
      PartnerSettlement.find().sort({ createdAt: -1 }).limit(10).lean().exec(),
    ])
    response.json({ ledger, settlements })
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/partner/ledger', ...partnerOnly, async (_request, response, next) => {
  try {
    response.json(await PartnerLedger.find().sort({ createdAt: -1 }).lean().exec())
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/partner/settlements', ...partnerOnly, async (_request, response, next) => {
  try {
    response.json(await PartnerSettlement.find().sort({ createdAt: -1 }).lean().exec())
  } catch (error) {
    next(error)
  }
})

tfcRouter.post('/admin/settlements/generate', ...superAdminOnly, async (request, response, next) => {
  try {
    const input = z.object({ partnerId: objectId, periodStart: dateString, periodEnd: dateString }).parse(request.body)
    const ledger = await PartnerLedger.find({
      partnerId: input.partnerId,
      createdAt: { $gte: input.periodStart, $lte: input.periodEnd },
    }).lean().exec()
    const grossRevenue = ledger.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0)
    const deductions = Math.abs(ledger.filter((item) => item.amount < 0).reduce((sum, item) => sum + item.amount, 0))
    const settlement = await PartnerSettlement.create({
      ...input,
      settlementId: await nextSequence('settlement', 'TFC-SET-'),
      grossRevenue,
      deductions,
      netAmount: grossRevenue - deductions,
      status: 'PENDING_APPROVAL',
    })
    await SettlementItem.insertMany(ledger.map((item) => ({ settlementId: settlement._id, ledgerId: item._id, amount: item.amount, notes: item.notes })))
    response.status(201).json(settlement)
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/admin/settlements', ...superAdminOnly, async (_request, response, next) => {
  try {
    response.json(await PartnerSettlement.find().sort({ createdAt: -1 }).lean().exec())
  } catch (error) {
    next(error)
  }
})

tfcRouter.patch('/admin/settlements/:settlementId/approve', ...superAdminOnly, async (request, response, next) => {
  try {
    const settlement = await PartnerSettlement.findByIdAndUpdate(
      request.params.settlementId,
      { status: 'APPROVED', approvedBy: request.user.id },
      { returnDocument: 'after' },
    ).lean().exec()
    if (!settlement) throw new HttpError(404, 'Settlement not found')
    response.json(settlement)
  } catch (error) {
    next(error)
  }
})

tfcRouter.patch('/admin/settlements/:settlementId/mark-paid', ...superAdminOnly, async (request, response, next) => {
  try {
    const input = z.object({ transactionReference: z.string().optional(), paymentProofUrl: z.string().optional() }).parse(request.body)
    const settlement = await PartnerSettlement.findByIdAndUpdate(
      request.params.settlementId,
      { ...input, status: 'PAID' },
      { returnDocument: 'after' },
    ).lean().exec()
    if (!settlement) throw new HttpError(404, 'Settlement not found')
    response.json(settlement)
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/admin/dashboard', ...adminOnly, async (_request, response, next) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const [
      totalGymMembers,
      activeMembers,
      expiredMembers,
      expiringSoon,
      pendingGymPayments,
      gymRevenue,
      turfBookingsToday,
      turfBookingsThisMonth,
      turfRevenue,
      pendingPartnerSettlements,
      newFeedbackItems,
      monthlyPayments,
    ] = await Promise.all([
      GymMember.countDocuments({ isDeleted: false }),
      GymMember.countDocuments({ membershipStatus: 'ACTIVE', isDeleted: false }),
      GymMember.countDocuments({ membershipStatus: 'EXPIRED', isDeleted: false }),
      GymMember.countDocuments({ membershipStatus: 'EXPIRING_SOON', isDeleted: false }),
      GymMember.countDocuments({ paymentStatus: { $in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] }, isDeleted: false }),
      Payment.aggregate([{ $match: { status: 'PAID', purpose: /GYM|MEMBERSHIP/i } }, { $group: { _id: null, total: { $sum: '$finalAmount' } } }]),
      TurfBooking.countDocuments({ startAt: { $gte: startOfDay }, status: { $in: ['CONFIRMED', 'COMPLETED'] } }),
      TurfBooking.countDocuments({ startAt: { $gte: startOfMonth }, status: { $in: ['CONFIRMED', 'COMPLETED'] } }),
      Payment.aggregate([{ $match: { status: 'PAID', purpose: /TURF/i } }, { $group: { _id: null, total: { $sum: '$finalAmount' } } }]),
      PartnerSettlement.countDocuments({ status: { $in: ['DRAFT', 'PENDING_APPROVAL', 'DISPUTED'] } }),
      Feedback.countDocuments({ status: 'NEW' }),
      Payment.aggregate([
        { $match: { status: 'PAID' } },
        { $group: { _id: { month: { $month: '$paidDate' }, year: { $year: '$paidDate' }, method: '$method' }, total: { $sum: '$finalAmount' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ])

    response.json({
      totalGymMembers,
      activeMembers,
      expiredMembers,
      expiringSoon,
      pendingGymPayments,
      gymRevenue: gymRevenue[0]?.total ?? 0,
      turfBookingsToday,
      turfBookingsThisMonth,
      turfRevenue: turfRevenue[0]?.total ?? 0,
      pendingPartnerSettlements,
      newFeedbackItems,
      charts: { monthlyPayments },
    })
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/notifications', authenticate, async (request, response, next) => {
  try {
    response.json(await Notification.find({ userId: request.user.id }).sort({ createdAt: -1 }).lean().exec())
  } catch (error) {
    next(error)
  }
})

tfcRouter.patch('/notifications/:notificationId/read', authenticate, async (request, response, next) => {
  try {
    response.json(await Notification.findOneAndUpdate({ _id: request.params.notificationId, userId: request.user.id }, { readAt: new Date() }, { returnDocument: 'after' }).lean().exec())
  } catch (error) {
    next(error)
  }
})

tfcRouter.patch('/notifications/read-all', authenticate, async (request, response, next) => {
  try {
    await Notification.updateMany({ userId: request.user.id, readAt: { $exists: false } }, { readAt: new Date() }).exec()
    response.status(204).send()
  } catch (error) {
    next(error)
  }
})

tfcRouter.get('/admin/website-content/:key', ...adminOnly, async (request, response, next) => {
  try {
    response.json(await WebsiteContent.findOne({ key: request.params.key }).lean().exec())
  } catch (error) {
    next(error)
  }
})

tfcRouter.put('/admin/website-content/:key', ...superAdminOnly, async (request, response, next) => {
  try {
    const input = z.object({ title: z.string().optional(), content: z.record(z.string(), z.unknown()) }).parse(request.body)
    const content = await WebsiteContent.findOneAndUpdate(
      { key: request.params.key },
      { ...input, updatedBy: request.user.id },
      { returnDocument: 'after', upsert: true },
    ).lean().exec()
    response.json(content)
  } catch (error) {
    next(error)
  }
})
