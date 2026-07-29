import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '../ui/Card.jsx'
import { PageHeader } from '../ui/PageHeader.jsx'
import { Button } from '../ui/Button.jsx'
import { Badge } from '../ui/Badge.jsx'
import { SearchBar } from '../ui/SearchBar.jsx'
import { todayInput } from '../../utils/format.js'
import { tfcApi } from '../../api/members.js'

export function TurfManagementPage() {
  const [date, setDate] = useState(todayInput())
  const [editingSlot, setEditingSlot] = useState(null)
  const [queryFilter, setQueryFilter] = useState('')
  const queryClient = useQueryClient()
  const slotsQuery = useQuery({ queryKey: ['turf-slots', date], queryFn: () => tfcApi.turfSlots(date) })
  const generateMutation = useMutation({ mutationFn: () => tfcApi.generateTurfSlots(date), onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['turf-slots', date] }) })
  const saveMutation = useMutation({ mutationFn: (input) => input.id ? tfcApi.updateTurfSlot(input.id, input) : tfcApi.upsertTurfSlot(input), onSuccess: async () => { setEditingSlot(null); await queryClient.invalidateQueries({ queryKey: ['turf-slots', date] }) } })

  const slots = slotsQuery.data?.slots ?? []
  const filteredSlots = slots.filter((slot) => slot.label.toLowerCase().includes(queryFilter.toLowerCase()))

  const statusLabel = (slot) => {
    if (slot.isPast) return 'Past'
    if (slot.status === 'booked') return 'Booked'
    if (slot.status === 'blocked') return 'Blocked'
    return 'Available'
  }

  const statusVariant = (slot) => {
    if (slot.isPast) return 'error'
    if (slot.status === 'booked') return 'error'
    if (slot.status === 'blocked') return 'warning'
    return 'success'
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Turf" title="Turf slot management" description="Generate, edit, and track hourly turf availability inside the premium admin console." actions={[<Button key="generate" variant="secondary" onClick={() => generateMutation.mutate()}>Generate slots</Button>]} />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_420px]">
        <Card className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_320px]">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Selected date</p>
              <h2 className="mt-2 text-2xl font-bold text-white">{date}</h2>
            </div>
            <input className="rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>
          <SearchBar value={queryFilter} onChange={setQueryFilter} placeholder="Filter slots" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredSlots.length === 0 ? (
              <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-8 text-center text-slate-400">No matching slots</div>
            ) : null}
            {filteredSlots.map((slot) => (
              <button key={`${slot.date}-${slot.startTime}`} type="button" onClick={() => setEditingSlot(slot)} className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5 text-left transition hover:border-emerald-400/40 hover:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-white">{slot.label}</p>
                    <p className="mt-2 text-sm text-slate-400">₹{slot.price ?? 800}</p>
                  </div>
                  <Badge variant={statusVariant(slot)}>{statusLabel(slot)}</Badge>
                </div>
              </button>
            ))}
          </div>
        </Card>
        <Card className="space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Slot editor</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Manage selected slot</h2>
          </div>
          {!editingSlot ? (
            <p className="rounded-[28px] border border-dashed border-white/10 bg-slate-950/80 p-6 text-sm text-slate-400">Select a slot from the list to update its status and pricing.</p>
          ) : (
            <div className="grid gap-4">
              <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-4">
                <p className="text-base font-semibold text-white">{editingSlot.label}</p>
                <p className="mt-2 text-sm text-slate-400">{editingSlot.date}</p>
              </div>
              <label className="text-sm font-semibold text-slate-200">Price</label>
              <input className="rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" type="number" value={editingSlot.price ?? 800} onChange={(event) => setEditingSlot((slot) => ({ ...slot, price: Number(event.target.value) }))} />
              <label className="text-sm font-semibold text-slate-200">Status</label>
              <select className="rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" value={editingSlot.status} onChange={(event) => setEditingSlot((slot) => ({ ...slot, status: event.target.value }))}>
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="blocked">Blocked</option>
              </select>
              <Button onClick={() => saveMutation.mutate({ ...editingSlot, date })}>Save slot</Button>
              {saveMutation.isError && <p className="rounded-3xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{saveMutation.error.message}</p>}
              {saveMutation.isSuccess && <p className="rounded-3xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">Slot updated successfully.</p>}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
