import bcrypt from 'bcryptjs'
import { connectToDatabase, disconnectFromDatabase } from '../config/database.js'
import { env } from '../config/env.js'
import {
  Feedback,
  GymMember,
  MembershipPlan,
  PartnerLedger,
  PartnerSettlement,
  Payment,
  Turf,
  TurfBooking,
  TurfPartner,
  User,
  WebsiteContent,
} from '../models/tfc.models.js'
import { nextSequence, nextYearSequence } from '../services/id.service.js'

async function upsertUser({ email, password, ...rest }) {
  const passwordHash = await bcrypt.hash(password, 12)
  return User.findOneAndUpdate(
    { email },
    { email, passwordHash, accountStatus: 'ACTIVE', ...rest },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  ).exec()
}

async function seed() {
  await connectToDatabase()

  const [superAdmin, customer, partnerUser] = await Promise.all([
    upsertUser({
      name: env.SUPER_ADMIN_NAME,
      email: env.SUPER_ADMIN_EMAIL,
      password: env.SUPER_ADMIN_PASSWORD,
      role: 'SUPER_ADMIN',
      phone: '+919999999901',
    }),
    upsertUser({
      name: 'Demo Customer',
      email: 'customer@tfc.local',
      password: 'TFCMember123',
      role: 'CUSTOMER',
      phone: '+919999999902',
    }),
    upsertUser({
      name: 'Demo Turf Partner',
      email: 'partner@tfc.local',
      password: 'TFCPartner123',
      role: 'PARTNER',
      phone: '+919999999903',
    }),
  ])

  const plans = await MembershipPlan.bulkWrite([
    {
      updateOne: {
        filter: { name: 'Monthly Gym' },
        update: {
          name: 'Monthly Gym',
          description: 'Full gym access for one month.',
          durationDays: 30,
          originalPrice: 1000,
          discountedPrice: 1000,
          tax: 0,
          includedFacilities: ['Cardio', 'Strength floor', 'Locker'],
          displayOrder: 1,
        },
        upsert: true,
      },
    },
    {
      updateOne: {
        filter: { name: 'Quarterly Gym' },
        update: {
          name: 'Quarterly Gym',
          description: 'Best value plan for consistent training.',
          durationDays: 90,
          originalPrice: 2500,
          discountedPrice: 2500,
          tax: 0,
          includedFacilities: ['Cardio', 'Strength floor', 'Locker', 'Trainer consultation'],
          displayOrder: 2,
        },
        upsert: true,
      },
    },
    {
      updateOne: {
        filter: { name: 'Annual Gym' },
        update: {
          name: 'Annual Gym',
          description: 'Complete 12-month TFC gym membership.',
          durationDays: 365,
          originalPrice: 9000,
          discountedPrice: 9000,
          tax: 0,
          includedFacilities: ['Cardio', 'Strength floor', 'Locker', 'Trainer consultation', 'Priority renewals'],
          displayOrder: 3,
        },
        upsert: true,
      },
    },
  ])

  const monthlyPlan = await MembershipPlan.findOne({ name: 'Monthly Gym' }).exec()
  const start = new Date()
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + 30)

  const member = await GymMember.findOneAndUpdate(
    { email: customer.email },
    {
      memberId: 'TFC-GYM-000001',
      userId: customer._id,
      fullName: customer.name,
      email: customer.email,
      phone: customer.phone,
      membershipPlanId: monthlyPlan._id,
      membershipStartDate: start,
      membershipExpiryDate: expiry,
      membershipStatus: 'ACTIVE',
      paymentStatus: 'PAID',
      assignedTrainer: 'Coach Arjun',
      createdBy: superAdmin._id,
      lastUpdatedBy: superAdmin._id,
    },
    { returnDocument: 'after', upsert: true },
  ).exec()

  const turf = await Turf.findOneAndUpdate(
    { name: 'TFC Main Turf' },
    {
      name: 'TFC Main Turf',
      description: 'Premium football and cricket turf with floodlights.',
      images: ['/bhaiya.jpg'],
      supportedSports: ['FOOTBALL', 'CRICKET'],
      location: { address: 'Jawahar Nagar, near Jeewan Ganga Banquet Hall', mapUrl: 'https://maps.google.com' },
      weekdayPrice: 800,
      weekendPrice: 800,
      holidayPrice: 800,
      peakHourPrice: 800,
      perPersonPrice: 100,
      cancellationPolicy: 'Free cancellation up to 12 hours before slot time.',
    },
    { returnDocument: 'after', upsert: true },
  ).exec()

  const bookingStart = new Date()
  bookingStart.setDate(bookingStart.getDate() + 1)
  bookingStart.setHours(19, 0, 0, 0)
  const bookingEnd = new Date(bookingStart)
  bookingEnd.setHours(20, 0, 0, 0)

  const booking = await TurfBooking.findOneAndUpdate(
    { turfId: turf._id, startAt: bookingStart },
    {
      bookingId: await nextYearSequence('turf-booking-seed', 'TFC-TURF-'),
      customerId: customer._id,
      turfId: turf._id,
      sport: 'FOOTBALL',
      startAt: bookingStart,
      endAt: bookingEnd,
      players: 10,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      priceBreakdown: { base: 800, tax: 0, discount: 0, total: 800 },
    },
    { returnDocument: 'after', upsert: true },
  ).exec()

  const partner = await TurfPartner.findOneAndUpdate(
    { email: partnerUser.email },
    {
      name: partnerUser.name,
      email: partnerUser.email,
      phone: partnerUser.phone,
      ownershipPercentage: 50,
      profitSharingPercentage: 50,
      status: 'ACTIVE',
    },
    { returnDocument: 'after', upsert: true },
  ).exec()

  await Payment.findOneAndUpdate(
    { internalPaymentId: 'TFC-PAY-000001' },
    {
      internalPaymentId: 'TFC-PAY-000001',
      userId: customer._id,
      memberId: member._id,
      purpose: 'GYM_MEMBERSHIP',
      amount: 1000,
      tax: 0,
      finalAmount: 1000,
      method: 'CASH',
      status: 'PAID',
      paidDate: new Date(),
      recordedBy: superAdmin._id,
    },
    { upsert: true },
  ).exec()

  await PartnerLedger.findOneAndUpdate(
    { partnerId: partner._id, bookingId: booking._id, type: 'REVENUE_SHARE' },
    { partnerId: partner._id, bookingId: booking._id, type: 'REVENUE_SHARE', amount: 400, percentageSnapshot: 50, notes: 'Seed booking share' },
    { upsert: true },
  ).exec()

  await PartnerSettlement.findOneAndUpdate(
    { settlementId: 'TFC-SET-000001' },
    { settlementId: 'TFC-SET-000001', partnerId: partner._id, periodStart: start, periodEnd: expiry, status: 'DRAFT', grossRevenue: 400, netAmount: 400 },
    { upsert: true },
  ).exec()

  await Feedback.findOneAndUpdate(
    { email: 'customer@tfc.local', category: 'TURF_QUALITY' },
    { name: 'Demo Customer', email: 'customer@tfc.local', category: 'TURF_QUALITY', rating: 5, message: 'The turf lights and surface are excellent.', suggestions: 'Add more evening slots.' },
    { upsert: true },
  ).exec()

  await WebsiteContent.findOneAndUpdate(
    { key: 'home' },
    {
      key: 'home',
      title: 'TFC Gym & Turf',
      content: {
        brand: 'TFC Gym & Turf',
        tagline: 'Train hard. Play harder.',
        timings: 'Gym 5 AM - 11 PM, Turf 6 AM - 12 AM',
        contact: { phone: '+91 98765 43210', email: 'hello@tfc.local', address: 'Jawahar Nagar, near Jeewan Ganga Banquet Hall' },
        facilities: ['Strength training', 'Cardio', 'Premium turf', 'Floodlights', 'Changing rooms'],
      },
      updatedBy: superAdmin._id,
    },
    { upsert: true },
  ).exec()

  console.log('Seed complete')
  console.log(`Super Admin: ${env.SUPER_ADMIN_EMAIL} / ${env.SUPER_ADMIN_PASSWORD}`)
  console.log('Customer: customer@tfc.local / TFCMember123')
  console.log('Partner: partner@tfc.local / TFCPartner123')
  console.log(`Plans upserted: ${plans.modifiedCount + plans.upsertedCount}`)
}

seed()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await disconnectFromDatabase()
  })
