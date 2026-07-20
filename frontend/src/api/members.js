import { http, unwrap } from './http.js'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''
const MEMBERS_ENDPOINT = `${apiBaseUrl}/api/v1/members`

async function parseResponse(response) {
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}))
    throw new Error(problem.detail ?? problem.title ?? 'The request failed')
  }

  return response.json()
}

export async function getMembers(signal) {
  const response = await fetch(MEMBERS_ENDPOINT, {
    headers: { Accept: 'application/json' },
    signal,
  })
  return parseResponse(response)
}

export async function getDashboard(signal) {
  const response = await fetch(`${MEMBERS_ENDPOINT}/dashboard`, {
    headers: { Accept: 'application/json' },
    signal,
  })
  return parseResponse(response)
}

export async function createMember(input) {
  const response = await fetch(MEMBERS_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
  return parseResponse(response)
}

export async function updateMember(id, input) {
  const response = await fetch(`${MEMBERS_ENDPOINT}/${id}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
  return parseResponse(response)
}

export async function deleteMember(id) {
  const response = await fetch(`${MEMBERS_ENDPOINT}/${id}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    const problem = await response.json().catch(() => ({}))
    throw new Error(problem.detail ?? problem.title ?? 'The request failed')
  }
}

export const tfcApi = {
  home: () => http.get('/api/public/home').then(unwrap),
  adminDashboard: () => http.get('/api/admin/dashboard').then(unwrap),
  plans: () => http.get('/api/membership-plans').then(unwrap),
  turfs: () => http.get('/api/turfs').then(unwrap),
  turfAvailability: (turfId, date) =>
    http.get(`/api/turfs/${turfId}/availability`, { params: { date } }).then(unwrap),
  feedback: (input) => http.post('/api/feedback', input).then(unwrap),
  adminMembers: () => http.get('/api/admin/members').then(unwrap),
  createAdminMember: (input) => http.post('/api/admin/members', input).then(unwrap),
  manualPayment: (input) => http.post('/api/admin/payments/manual', input).then(unwrap),
  partnerDashboard: () => http.get('/api/partner/dashboard').then(unwrap),
  myBookings: () => http.get('/api/turf-bookings/my').then(unwrap),
  myPayments: () => http.get('/api/payments/my').then(unwrap),
  createBooking: (input) => http.post('/api/turf-bookings', input).then(unwrap),
  turfSlots: (date) => http.get('/api/turf-slots', { params: { date } }).then(unwrap),
  generateTurfSlots: (date) => http.post('/api/admin/turf-slots/generate-day', { date }).then(unwrap),
  upsertTurfSlot: (input) => http.post('/api/admin/turf-slots/upsert', input).then(unwrap),
  updateTurfSlot: (id, input) => http.put(`/api/admin/turf-slots/${id}`, input).then(unwrap),
}
