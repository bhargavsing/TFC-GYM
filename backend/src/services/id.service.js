import { Counter } from '../models/tfc.models.js'

export async function nextSequence(key, prefix, width = 6) {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { returnDocument: 'after', upsert: true },
  )
    .lean()
    .exec()

  return `${prefix}${String(counter.value).padStart(width, '0')}`
}

export async function nextYearSequence(key, prefix, width = 6) {
  const year = new Date().getFullYear()
  return nextSequence(`${key}-${year}`, `${prefix}${year}-`, width)
}
