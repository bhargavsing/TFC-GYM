import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card } from '../ui/Card.jsx'
import { PageHeader } from '../ui/PageHeader.jsx'
import { Button } from '../ui/Button.jsx'
import { SearchBar } from '../ui/SearchBar.jsx'
import { tfcApi } from '../../api/members.js'

const statusBadge = {
  CONFIRMED: 'success',
  COMPLETED: 'success',
  PENDING_PAYMENT: 'warning',
  CANCELLED: 'error',
  REFUNDED: 'error',
  NO_SHOW: 'error',
  BLOCKED_BY_ADMIN: 'warning',
}

export function BookingListPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const bookingQuery = useQuery({ queryKey: ['admin-turf-bookings', search, statusFilter], queryFn: () => tfcApi.adminTurfBookings(), retry: false })
  const updateStatusMutation = useMutation({ mutationFn: ({ bookingId, status }) => tfcApi.updateBookingStatus(bookingId, status), onSuccess: () => bookingQuery.refetch() })
  const bookings = bookingQuery.data ?? []
  const filteredBookings = bookings.filter((booking) => {
    const normalized = search.toLowerCase()
    return (
      !normalized ||
      booking.bookingId?.toLowerCase().includes(normalized) ||
      booking.bookingName?.toLowerCase().includes(normalized) ||
      booking.turfId?.name?.toLowerCase().includes(normalized)
    )
  }).filter((booking) => !statusFilter || booking.status === statusFilter)

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Bookings" title="Turf and session bookings" description="Review upcoming turf bookings, update statuses, and keep scheduling aligned with operations." actions={[<Button key="refresh" variant="secondary" onClick={() => bookingQuery.refetch()}>Refresh</Button>]}/>
      <Card className="space-y-5">
        <div className="grid gap-4 md:grid-cols-[1fr_200px]">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by booking id, name, turf" />
          <select className="rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {Object.keys(statusBadge).map((status) => (
              <option key={status} value={status}>{status.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-4">
          {filteredBookings.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-8 text-center text-slate-400">No bookings found.</div>
          ) : (
            filteredBookings.map((booking) => (
              <button key={booking._id} type="button" onClick={() => setSelectedBooking(booking)} className="group rounded-[28px] border border-white/10 bg-slate-950/80 p-5 text-left transition hover:border-emerald-400/40 hover:bg-white/5">
                <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                  <div>
                    <p className="text-lg font-semibold text-white">{booking.bookingId ?? 'TFC-TURF-XXXX'}</p>
                    <p className="mt-1 text-sm text-slate-400">{booking.turfId?.name ?? 'Unknown turf'} · {booking.sport}</p>
                    <p className="mt-2 text-sm text-slate-300">{new Date(booking.startAt).toLocaleString('en-IN')} — {new Date(booking.endAt).toLocaleTimeString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-white">₹{booking.priceBreakdown?.total ?? 0}</p>
                    <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[booking.status] === 'success' ? 'bg-emerald-500/15 text-emerald-200' : statusBadge[booking.status] === 'warning' ? 'bg-amber-500/15 text-amber-200' : 'bg-red-500/15 text-red-200'}`}>{booking.status.replace('_', ' ')}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>
      {selectedBooking ? (
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Booking details</p>
              <h2 className="mt-2 text-2xl font-bold text-white">{selectedBooking.bookingId}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {['CONFIRMED', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'NO_SHOW', 'BLOCKED_BY_ADMIN'].map((status) => (
                <Button key={status} variant="ghost" onClick={() => updateStatusMutation.mutate({ bookingId: selectedBooking._id, status })}>{status.replace('_', ' ')}</Button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Customer</p>
              <p className="mt-2 text-base text-white">{selectedBooking.bookingName ?? 'Guest'}</p>
              <p className="mt-1 text-sm text-slate-400">{selectedBooking.bookingPhone ?? 'No phone'}</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Slot</p>
              <p className="mt-2 text-base text-white">{new Date(selectedBooking.startAt).toLocaleString('en-IN')}</p>
              <p className="mt-1 text-sm text-slate-400">{new Date(selectedBooking.endAt).toLocaleString('en-IN')}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Status</p>
              <p className="mt-2 text-base font-semibold text-white">{selectedBooking.status.replace('_', ' ')}</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Notes</p>
              <p className="mt-2 text-sm text-slate-300">{selectedBooking.notes ?? 'No notes.'}</p>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
