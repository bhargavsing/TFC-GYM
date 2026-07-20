import mongoose from 'mongoose'

export const subscriptionStatuses = [
  'PENDING',
  'ACTIVE',
  'EXPIRED',
  'CANCELLED',
]

const subscriptionSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },
    planName: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: subscriptionStatuses,
      required: true,
      default: 'PENDING',
    },
    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
  },
  {
    collection: 'subscriptions',
    timestamps: true,
    versionKey: false,
  },
)

subscriptionSchema.index({ status: 1, endDate: 1 })

export const Subscription = mongoose.model('Subscription', subscriptionSchema)
