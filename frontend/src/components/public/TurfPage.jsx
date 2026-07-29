import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '../ui/Card.jsx'
import { PageHeader } from '../ui/PageHeader.jsx'
import { Button } from '../ui/Button.jsx'
import { Badge } from '../ui/Badge.jsx'
import { todayInput } from '../../utils/format.js'
import { tfcApi } from '../../api/members.js'

function slotTone(slot) {
  if (slot.isPast) return 'error'
  if (slot.status === 'booked') return 'error'
  if (slot.status === 'blocked') return 'warning'
  return 'success'
}

export function TurfPage() {
  const [date, setDate] = useState(todayInput())
  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const slotsQuery = useQuery({ queryKey: ['turf-slots', date], queryFn: () => tfcApi.turfSlots(date) })
  const slots = slotsQuery.data?.slots ?? []

  const selectedSlot = useMemo(() => {
    if (!selectedSlotId) return null
    return slots.find((slot) => slot.id === selectedSlotId || `${slot.startTime}-${slot.endTime}` === selectedSlotId) ?? null
  }, [selectedSlotId, slots])

  const canPay = selectedSlot && selectedSlot.status === 'available' && !selectedSlot.isPast

  return (
    <main className="min-h-screen bg-[#09090B] text-slate-100">
      <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 xl:px-8">
        <PageHeader
          eyebrow="Turf"
          title="Hourly turf availability"
          description="Browse the full 24-hour turf calendar, choose a slot as a guest, and complete payment with Razorpay."
        />
        <Card className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_420px]">
          <div className="space-y-6">
            <div className="grid gap-3 rounded-[28px] border border-white/10 bg-white/5 p-4 sm:grid-cols-[minmax(0,1fr)_220px]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Choose date</p>
                <p className="mt-2 text-sm text-slate-300">Select a day and book an hourly turf slot as a guest. Then use the Razorpay payment link to reserve your session.</p>
              </div>
              <div>
                <input
                  className="w-full rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  type="date"
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value)
                    setSelectedSlotId(null)
                  }}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {slots.length === 0 && (
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-center text-slate-300">No turf slots available for this date.</div>
              )}
              {slots.map((slot) => {
                const slotId = slot.id ?? `${slot.startTime}-${slot.endTime}`
                const isSelected = selectedSlotId === slotId
                return (
                  <button
                    key={slotId}
                    type="button"
                    onClick={() => setSelectedSlotId(slotId)}
                    className={`rounded-[28px] border p-5 text-left shadow-[0_24px_80px_rgba(0,0,0,0.18)] transition ${
                      isSelected
                        ? 'border-emerald-400/50 bg-emerald-500/10 text-white'
                        : 'border-white/10 bg-slate-950/80 text-slate-100 hover:border-emerald-400/30 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xl font-bold">{slot.label}</p>
                        <p className="mt-2 text-sm text-slate-400">₹{slot.price ?? 800} / hr</p>
                      </div>
                      <Badge variant={slotTone(slot)}>{slot.isPast ? 'Past' : slot.status}</Badge>
                    </div>
                    <div className="mt-4 text-sm leading-6 text-slate-300">
                      {slot.status === 'available' && !slot.isPast
                        ? 'Guest booking available — select to pay.'
                        : slot.isPast
                        ? 'This slot has already passed.'
                        : 'This slot is not available for booking.'}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Selected slot</p>
                <h2 className="mt-2 text-2xl font-bold text-white">{selectedSlot ? selectedSlot.label : 'Choose a slot'}</h2>
              </div>
              <div className="rounded-[28px] bg-slate-950/80 p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Date</p>
                <p className="mt-2 text-lg text-white">{date}</p>
              </div>
              <div className="rounded-[28px] bg-slate-950/80 p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Time</p>
                <p className="mt-2 text-lg text-white">{selectedSlot ? selectedSlot.label : 'No slot selected'}</p>
              </div>
              <div className="rounded-[28px] bg-slate-950/80 p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Price</p>
                <p className="mt-2 text-3xl font-semibold text-white">₹{selectedSlot?.price ?? 0}</p>
                <p className="mt-1 text-sm text-slate-400">Payment is completed through Razorpay.</p>
              </div>
              <Button
                variant="primary"
                className="w-full"
                disabled={!canPay}
                onClick={() => window.open('https://rzp.io/rzp/gTywfblO', '_blank', 'noopener,noreferrer')}
              >
                {canPay ? 'Make a payment' : 'Select an available slot'}
              </Button>
              {selectedSlot && !canPay ? (
                <p className="rounded-3xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  This selection cannot be paid for. Choose another available slot or date.
                </p>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
