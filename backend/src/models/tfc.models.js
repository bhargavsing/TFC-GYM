import mongoose from 'mongoose'

const { Schema } = mongoose

export const userRoles = ['SUPER_ADMIN', 'ADMIN', 'PARTNER', 'CUSTOMER']
export const accountStatuses = ['ACTIVE', 'BLOCKED', 'PENDING']
export const membershipStatuses = [
  'ACTIVE',
  'EXPIRING_SOON',
  'EXPIRED',
  'FROZEN',
  'CANCELLED',
  'PENDING_ACTIVATION',
]
export const tfcPaymentStatuses = [
  'PAID',
  'PARTIALLY_PAID',
  'PENDING',
  'OVERDUE',
  'REFUNDED',
  'FAILED',
]
export const bookingStatuses = [
  'PENDING_PAYMENT',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'NO_SHOW',
  'BLOCKED_BY_ADMIN',
]
export const settlementStatuses = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'PAID',
  'REJECTED',
  'DISPUTED',
]

const moneyFields = {
  amount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  finalAmount: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: 'INR', uppercase: true, minlength: 3, maxlength: 3 },
}

const softDeleteFields = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date },
}

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    phone: { type: String, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: userRoles, default: 'CUSTOMER', index: true },
    accountStatus: { type: String, enum: accountStatuses, default: 'ACTIVE', index: true },
    lastLoginAt: Date,
    loginAttempts: { type: Number, default: 0 },
    lockedUntil: Date,
    profilePhotoUrl: String,
    preferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true },
    },
    ...softDeleteFields,
  },
  { collection: 'users', timestamps: true, versionKey: false },
)

const adminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      maxlength: 80,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, default: 'admin', enum: ['admin'] },
    isActive: { type: Boolean, default: true, index: true },
    lastLoginAt: Date,
  },
  { collection: 'admins', timestamps: true, versionKey: false },
)

const refreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: Date,
    userAgent: String,
    ipAddress: String,
  },
  { collection: 'refresh_tokens', timestamps: true, versionKey: false },
)

const turfSlotSchema = new Schema(
  {
    date: { type: Date, required: true, index: true },
    startTime: {
      type: String,
      required: true,
      trim: true,
      match: /^([01]\d|2[0-3]):00$/,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
      match: /^(([01]\d|2[0-3]):00|00:00)$/,
    },
    status: {
      type: String,
      enum: ['available', 'booked', 'blocked'],
      default: 'available',
      index: true,
    },
    price: { type: Number, default: 800, min: 0 },
    bookingName: { type: String, trim: true, maxlength: 120 },
    bookingPhone: { type: String, trim: true, maxlength: 30 },
    bookingReference: { type: String, trim: true, maxlength: 120 },
    adminNote: { type: String, trim: true, maxlength: 600 },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { collection: 'turf_slots', timestamps: true, versionKey: false },
)
turfSlotSchema.index({ date: 1, startTime: 1, endTime: 1 }, { unique: true })

const counterSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Number, default: 0 },
  },
  { collection: 'counters', versionKey: false },
)

const gymMemberSchema = new Schema(
  {
    memberId: { type: String, unique: true, sparse: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    fullName: { type: String, required: true, trim: true, index: true },
    profilePhotoUrl: String,
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, required: true, trim: true, index: true },
    emergencyContact: { name: String, phone: String, relation: String },
    dateOfBirth: Date,
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] },
    address: { line1: String, line2: String, city: String, state: String, postalCode: String, country: String },
    joiningDate: { type: Date, default: Date.now, index: true },
    membershipPlanId: { type: Schema.Types.ObjectId, ref: 'MembershipPlan', index: true },
    membershipStartDate: { type: Date, required: true },
    membershipExpiryDate: { type: Date, required: true, index: true },
    paymentStatus: { type: String, enum: tfcPaymentStatuses, default: 'PENDING', index: true },
    membershipStatus: { type: String, enum: membershipStatuses, default: 'PENDING_ACTIVATION', index: true },
    assignedTrainer: String,
    healthNotes: String,
    internalAdminNotes: { type: String, select: false },
    identityDocument: { type: { type: String }, number: String },
    sourceOfRegistration: { type: String, default: 'ADMIN' },
    outstandingAmount: { type: Number, default: 0, min: 0, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    ...softDeleteFields,
  },
  { collection: 'gym_members', timestamps: true, versionKey: false },
)
gymMemberSchema.index({ fullName: 'text', email: 'text', phone: 'text', memberId: 'text' })

const membershipPlanSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: String,
    durationDays: { type: Number, required: true, min: 1 },
    originalPrice: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    registrationFee: { type: Number, default: 0, min: 0 },
    personalTrainingFee: { type: Number, default: 0, min: 0 },
    includedFacilities: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0, index: true },
    ...softDeleteFields,
  },
  { collection: 'membership_plans', timestamps: true, versionKey: false },
)

const membershipSchema = new Schema(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'GymMember', required: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: 'MembershipPlan', required: true },
    startDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true, index: true },
    status: { type: String, enum: membershipStatuses, default: 'ACTIVE', index: true },
    renewalAmount: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { collection: 'memberships', timestamps: true, versionKey: false },
)

const attendanceSchema = new Schema(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'GymMember', required: true, index: true },
    checkInAt: { type: Date, default: Date.now, index: true },
    checkOutAt: Date,
    dayKey: { type: String, required: true, index: true },
    overrideReason: String,
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { collection: 'attendance', timestamps: true, versionKey: false },
)
attendanceSchema.index({ memberId: 1, dayKey: 1 }, { unique: true, partialFilterExpression: { overrideReason: { $exists: false } } })

const turfSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: String,
    images: [String],
    location: { address: String, mapUrl: String },
    supportedSports: [{ type: String, enum: ['CRICKET', 'FOOTBALL', 'BADMINTON', 'OTHER'] }],
    openingTime: { type: String, default: '06:00' },
    closingTime: { type: String, default: '23:00' },
    slotDurationMinutes: { type: Number, default: 60, min: 15 },
    weekdayPrice: { type: Number, default: 1000, min: 0 },
    weekendPrice: { type: Number, default: 1400, min: 0 },
    holidayPrice: { type: Number, default: 1600, min: 0 },
    peakHourPrice: { type: Number, default: 1800, min: 0 },
    perPersonPrice: { type: Number, default: 100, min: 0 },
    maintenanceBlocks: [{ startAt: Date, endAt: Date, reason: String }],
    minBookingMinutes: { type: Number, default: 60 },
    maxBookingMinutes: { type: Number, default: 180 },
    advanceBookingDays: { type: Number, default: 30 },
    cancellationPolicy: String,
    isActive: { type: Boolean, default: true, index: true },
    ...softDeleteFields,
  },
  { collection: 'turfs', timestamps: true, versionKey: false },
)

const turfBookingSchema = new Schema(
  {
    bookingId: { type: String, unique: true, sparse: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    turfId: { type: Schema.Types.ObjectId, ref: 'Turf', required: true, index: true },
    sport: { type: String, required: true },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },
    players: { type: Number, default: 1, min: 1 },
    notes: String,
    couponCode: String,
    priceBreakdown: { base: Number, tax: Number, discount: Number, total: Number },
    status: { type: String, enum: bookingStatuses, default: 'PENDING_PAYMENT', index: true },
    paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'], default: 'PENDING', index: true },
  },
  { collection: 'turf_bookings', timestamps: true, versionKey: false },
)
turfBookingSchema.index({ turfId: 1, startAt: 1, endAt: 1, status: 1 })

const slotLockSchema = new Schema(
  {
    turfId: { type: Schema.Types.ObjectId, ref: 'Turf', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User' },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    token: { type: String, required: true, unique: true },
  },
  { collection: 'slot_locks', timestamps: true, versionKey: false },
)
slotLockSchema.index({ turfId: 1, startAt: 1, endAt: 1 }, { unique: true })

const paymentSchema = new Schema(
  {
    internalPaymentId: { type: String, unique: true, sparse: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'GymMember', index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'TurfBooking', index: true },
    purpose: { type: String, required: true },
    method: { type: String, enum: ['RAZORPAY', 'STRIPE', 'CASH', 'UPI', 'CARD'], default: 'CASH' },
    gatewayOrderId: String,
    gatewayPaymentId: String,
    gatewaySignature: String,
    status: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'], default: 'PENDING', index: true },
    paidDate: Date,
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: String,
    idempotencyKey: { type: String, unique: true, sparse: true },
    ...moneyFields,
  },
  { collection: 'payments', timestamps: true, versionKey: false },
)

const refundSchema = new Schema(
  {
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['REQUESTED', 'APPROVED', 'REJECTED', 'PROCESSED'], default: 'REQUESTED' },
    reason: String,
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { collection: 'refunds', timestamps: true, versionKey: false },
)

const turfPartnerSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    phone: String,
    address: String,
    bankAccount: { accountName: String, bankName: String, maskedAccountNumber: String, ifsc: String },
    taxDetails: { gstin: String, panMasked: String },
    ownershipPercentage: { type: Number, min: 0, max: 100, required: true },
    profitSharingPercentage: { type: Number, min: 0, max: 100, required: true },
    joiningDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'], default: 'ACTIVE', index: true },
    notes: String,
    ...softDeleteFields,
  },
  { collection: 'turf_partners', timestamps: true, versionKey: false },
)

const partnerLedgerSchema = new Schema(
  {
    partnerId: { type: Schema.Types.ObjectId, ref: 'TurfPartner', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'TurfBooking' },
    type: { type: String, enum: ['REVENUE_SHARE', 'EXPENSE', 'REFUND_ADJUSTMENT', 'MANUAL_ADJUSTMENT', 'SETTLEMENT_PAYOUT'], required: true },
    amount: { type: Number, required: true },
    percentageSnapshot: Number,
    notes: String,
  },
  { collection: 'partner_ledger', timestamps: true, versionKey: false },
)

const trainerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    title: { type: String, trim: true, maxlength: 120 },
    bio: { type: String, trim: true, maxlength: 1200 },
    specialties: [{ type: String, trim: true }],
    certifications: [{ type: String, trim: true }],
    hourlyRate: { type: Number, default: 0, min: 0 },
    profilePhotoUrl: String,
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0, index: true },
  },
  { collection: 'trainers', timestamps: true, versionKey: false },
)
trainerSchema.index({ name: 1, isActive: 1 })

const partnerSettlementSchema = new Schema(
  {
    settlementId: { type: Schema.Types.ObjectId, ref: 'PartnerSettlement', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'TurfBooking' },
    ledgerId: { type: Schema.Types.ObjectId, ref: 'PartnerLedger' },
    amount: { type: Number, required: true },
    notes: String,
  },
  { collection: 'settlement_items', timestamps: true, versionKey: false },
)

const feedbackSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    phone: String,
    category: { type: String, required: true, index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    message: { type: String, required: true },
    suggestions: String,
    anonymous: { type: Boolean, default: false },
    status: { type: String, enum: ['NEW', 'UNDER_REVIEW', 'PLANNED', 'RESOLVED', 'REJECTED'], default: 'NEW', index: true },
    adminResponse: String,
    internalNotes: String,
  },
  { collection: 'feedback', timestamps: true, versionKey: false },
)

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: String,
    readAt: Date,
    channels: [{ type: String, enum: ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP'] }],
  },
  { collection: 'notifications', timestamps: true, versionKey: false },
)

const couponSchema = new Schema(
  {
    code: { type: String, required: true, uppercase: true, unique: true },
    discountType: { type: String, enum: ['PERCENTAGE', 'FLAT'], default: 'FLAT' },
    discountValue: { type: Number, required: true, min: 0 },
    startsAt: Date,
    expiresAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { collection: 'coupons', timestamps: true, versionKey: false },
)

const websiteContentSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    title: String,
    content: Schema.Types.Mixed,
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { collection: 'website_content', timestamps: true, versionKey: false },
)

const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: String, index: true },
    previousValues: Schema.Types.Mixed,
    newValues: Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
  },
  { collection: 'audit_logs', timestamps: true, versionKey: false },
)

const expenseSchema = new Schema(
  {
    category: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    occurredAt: { type: Date, default: Date.now, index: true },
    notes: String,
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { collection: 'expenses', timestamps: true, versionKey: false },
)

export const User = mongoose.model('User', userSchema)
export const Admin = mongoose.model('Admin', adminSchema)
export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema)
export const Counter = mongoose.model('Counter', counterSchema)
export const GymMember = mongoose.model('GymMember', gymMemberSchema)
export const MembershipPlan = mongoose.model('MembershipPlan', membershipPlanSchema)
export const Membership = mongoose.model('Membership', membershipSchema)
export const Attendance = mongoose.model('Attendance', attendanceSchema)
export const Turf = mongoose.model('Turf', turfSchema)
export const TurfBooking = mongoose.model('TurfBooking', turfBookingSchema)
export const SlotLock = mongoose.model('SlotLock', slotLockSchema)
export const TurfSlot = mongoose.model('TurfSlot', turfSlotSchema)
export const Payment = mongoose.model('Payment', paymentSchema)
export const Refund = mongoose.model('Refund', refundSchema)
export const TurfPartner = mongoose.model('TurfPartner', turfPartnerSchema)
export const PartnerLedger = mongoose.model('PartnerLedger', partnerLedgerSchema)
export const PartnerSettlement = mongoose.model('PartnerSettlement', partnerSettlementSchema)
export const SettlementItem = mongoose.model('SettlementItem', settlementItemSchema)
export const Trainer = mongoose.model('Trainer', trainerSchema)
export const Feedback = mongoose.model('Feedback', feedbackSchema)
export const Notification = mongoose.model('Notification', notificationSchema)
export const Coupon = mongoose.model('Coupon', couponSchema)
export const WebsiteContent = mongoose.model('WebsiteContent', websiteContentSchema)
export const AuditLog = mongoose.model('AuditLog', auditLogSchema)
export const Expense = mongoose.model('Expense', expenseSchema)
