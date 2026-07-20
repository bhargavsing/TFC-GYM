import { z } from 'zod'
import { memberStatuses, membershipPlans, paymentStatuses } from './member.model.js'

const internationalPhone = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{7,14}$/, 'Must be a valid international phone number')

const optionalDate = z
  .string()
  .trim()
  .min(1)
  .pipe(z.coerce.date())
  .optional()

const memberInputSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email().trim().toLowerCase().max(254),
  phone: internationalPhone,
  status: z.enum(memberStatuses).optional(),
  plan: z.enum(membershipPlans).optional(),
  paymentStatus: z.enum(paymentStatuses).optional(),
  membershipStart: optionalDate,
  membershipEnd: optionalDate,
  lastPaymentAmount: z.coerce.number().min(0).optional(),
  lastPaymentDate: optionalDate,
  trainer: z.string().trim().max(120).optional(),
  goal: z.string().trim().max(160).optional(),
  emergencyContact: z
    .object({
      name: z.string().trim().max(120).optional(),
      phone: z.string().trim().optional(),
    })
    .optional(),
  notes: z.string().trim().max(600).optional(),
})

function withDefaultMembershipEnd(input) {
  if (input.membershipEnd) {
    return input
  }

  const start = input.membershipStart ?? new Date()
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)

  return {
    ...input,
    membershipStart: start,
    membershipEnd: end,
  }
}

export const createMemberSchema = memberInputSchema.transform(withDefaultMembershipEnd)

export const updateMemberSchema = memberInputSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one field is required',
  })
