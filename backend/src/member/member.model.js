import mongoose from 'mongoose'

export const memberStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED']
export const paymentStatuses = ['PAID', 'DUE', 'OVERDUE']
export const membershipPlans = ['BASIC', 'STANDARD', 'PREMIUM', 'PERSONAL_TRAINING']

const memberSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      unique: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: memberStatuses,
      default: 'ACTIVE',
      required: true,
    },
    plan: {
      type: String,
      enum: membershipPlans,
      default: 'STANDARD',
      required: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: paymentStatuses,
      default: 'DUE',
      required: true,
      index: true,
    },
    membershipStart: {
      type: Date,
      default: Date.now,
      required: true,
    },
    membershipEnd: {
      type: Date,
      required: true,
      index: true,
    },
    lastPaymentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastPaymentDate: {
      type: Date,
    },
    trainer: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    goal: {
      type: String,
      trim: true,
      maxlength: 160,
      default: '',
    },
    emergencyContact: {
      name: {
        type: String,
        trim: true,
        maxlength: 120,
        default: '',
      },
      phone: {
        type: String,
        trim: true,
        default: '',
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 600,
      default: '',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  {
    collection: 'members',
    versionKey: false,
  },
)

memberSchema.index({ status: 1, paymentStatus: 1 })

export const Member = mongoose.model('Member', memberSchema)
