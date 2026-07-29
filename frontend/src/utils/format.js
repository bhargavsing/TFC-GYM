export const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export const readableDate = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
})

export function toDateInput(value) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}

export function nextMonthDate() {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  return date.toISOString().slice(0, 10)
}

export function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

export function cls(...classes) {
  return classes.filter(Boolean).join(' ')
}
