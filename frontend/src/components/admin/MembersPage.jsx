import { useMemo, useState } from 'react'
import { Badge } from '../ui/Badge.jsx'
import { Button } from '../ui/Button.jsx'
import { Card } from '../ui/Card.jsx'
import { PageHeader } from '../ui/PageHeader.jsx'
import { SearchBar } from '../ui/SearchBar.jsx'
import { Skeleton } from '../ui/Skeleton.jsx'
import { TextInput } from '../ui/Input.jsx'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createMember, deleteMember, getDashboard, getMembers, updateMember } from '../../api/members.js'
import { readableDate, toDateInput } from '../../utils/format.js'

const blankMember = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  status: 'ACTIVE',
  plan: 'STANDARD',
  paymentStatus: 'DUE',
  membershipStart: new Date().toISOString().slice(0, 10),
  membershipEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10),
  lastPaymentAmount: 0,
  trainer: '',
  goal: '',
}

export function MembersPage() {
  const [form, setForm] = useState(blankMember)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()
  const membersQuery = useQuery({ queryKey: ['members'], queryFn: ({ signal }) => getMembers(signal) })
  const dashboardQuery = useQuery({ queryKey: ['members-dashboard'], queryFn: ({ signal }) => getDashboard(signal) })
  const saveMutation = useMutation({ mutationFn: (payload) => (editingId ? updateMember(editingId, payload) : createMember(payload)), onSuccess: async () => { setForm(blankMember); setEditingId(null); await queryClient.invalidateQueries({ queryKey: ['members'] }); await queryClient.invalidateQueries({ queryKey: ['members-dashboard'] }) } })
  const deleteMutation = useMutation({ mutationFn: deleteMember, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }) })

  const members = membersQuery.data ?? []
  const filteredMembers = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return members.filter((member) => [member.firstName, member.lastName, member.email, member.phone].join(' ').toLowerCase().includes(needle))
  }, [members, search])

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function editMember(member) {
    setEditingId(member.id ?? member._id)
    setForm({
      firstName: member.firstName ?? '',
      lastName: member.lastName ?? '',
      email: member.email ?? '',
      phone: member.phone ?? '',
      status: member.status ?? 'ACTIVE',
      plan: member.plan ?? 'STANDARD',
      paymentStatus: member.paymentStatus ?? 'DUE',
      membershipStart: toDateInput(member.membershipStart),
      membershipEnd: toDateInput(member.membershipEnd),
      lastPaymentAmount: member.lastPaymentAmount ?? 0,
      trainer: member.trainer ?? '',
      goal: member.goal ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Management" title="Member operations" description="Search, edit, and manage all active gym members with a premium SaaS workflow." actions={[<Button key="add" onClick={() => { setEditingId(null); setForm(blankMember) }} variant="secondary">New member</Button>]} />
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">{editingId ? 'Edit member' : 'Add member'}</h2>
            <p className="mt-2 text-sm text-slate-400">Use the form below to update member details or add a new membership record.</p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="First name" id="firstName" value={form.firstName} onChange={(event) => setField('firstName', event.target.value)} />
              <TextInput label="Last name" id="lastName" value={form.lastName} onChange={(event) => setField('lastName', event.target.value)} />
            </div>
            <TextInput label="Email" id="email" type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} />
            <TextInput label="Phone" id="phone" type="tel" value={form.phone} onChange={(event) => setField('phone', event.target.value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-3">
                <label className="text-sm font-semibold text-slate-200">Plan</label>
                <select className="rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" value={form.plan} onChange={(event) => setField('plan', event.target.value)}>
                  <option value="BASIC">Basic</option>
                  <option value="STANDARD">Standard</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="PERSONAL_TRAINING">Personal Training</option>
                </select>
              </div>
              <div className="grid gap-3">
                <label className="text-sm font-semibold text-slate-200">Status</label>
                <select className="rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" value={form.status} onChange={(event) => setField('status', event.target.value)}>
                  <option>ACTIVE</option>
                  <option>INACTIVE</option>
                  <option>SUSPENDED</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="Membership start" id="membershipStart" type="date" value={form.membershipStart} onChange={(event) => setField('membershipStart', event.target.value)} />
              <TextInput label="Membership end" id="membershipEnd" type="date" value={form.membershipEnd} onChange={(event) => setField('membershipEnd', event.target.value)} />
            </div>
            <TextInput label="Trainer" id="trainer" value={form.trainer} onChange={(event) => setField('trainer', event.target.value)} />
            <TextInput as="textarea" label="Goal" id="goal" value={form.goal} onChange={(event) => setField('goal', event.target.value)} />
            <Button onClick={() => saveMutation.mutate(form)}>{editingId ? 'Update member' : 'Add member'}</Button>
            {saveMutation.isSuccess && <p className="rounded-3xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">Member saved successfully.</p>}
            {saveMutation.isError && <p className="rounded-3xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{saveMutation.error.message}</p>}
          </div>
        </Card>
        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Directory</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Members</h2>
              </div>
              <SearchBar value={search} onChange={setSearch} placeholder="Search members" />
            </div>
            {membersQuery.isPending ? (
              <div className="grid gap-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            ) : null}
            {!membersQuery.isPending && filteredMembers.length === 0 ? (
              <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-8 text-center text-slate-400">No members match your search.</div>
            ) : null}
            <div className="hidden space-y-3 md:block">
              {filteredMembers.map((member) => (
                <div key={member.id ?? member._id} className="grid gap-4 rounded-[28px] border border-white/10 bg-slate-950/80 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="text-base font-semibold text-white">{member.firstName} {member.lastName}</p>
                    <p className="mt-1 text-sm text-slate-400">{member.email} · {member.phone}</p>
                    <p className="mt-2 text-sm text-slate-400">Plan: {member.plan} · Status: {member.status}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" onClick={() => editMember(member)}>Edit</Button>
                    <Button variant="danger" onClick={() => deleteMutation.mutate(member.id ?? member._id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid gap-4 md:hidden">
              {filteredMembers.map((member) => (
                <div key={member.id ?? member._id} className="rounded-[28px] border border-white/10 bg-slate-950/80 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-white">{member.firstName} {member.lastName}</p>
                      <p className="text-sm text-slate-400">{member.email}</p>
                    </div>
                    <Badge variant={member.paymentStatus === 'PAID' ? 'success' : member.paymentStatus === 'OVERDUE' ? 'error' : 'warning'}>{member.paymentStatus}</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button variant="ghost" onClick={() => editMember(member)}>Edit</Button>
                    <Button variant="danger" onClick={() => deleteMutation.mutate(member.id ?? member._id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Summary</p>
                  <p className="mt-2 text-2xl font-bold text-white">Member insights</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                  <p className="text-sm text-slate-400">Total records</p>
                  <p className="mt-2 text-3xl font-bold text-white">{dashboardQuery.data?.totalMembers ?? members.length}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                  <p className="text-sm text-slate-400">Active now</p>
                  <p className="mt-2 text-3xl font-bold text-white">{dashboardQuery.data?.byStatus?.ACTIVE ?? '--'}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Payment status</p>
                <div className="mt-4 grid gap-3">
                  <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-900/80 p-3">
                    <span className="text-sm text-slate-300">Paid</span>
                    <strong className="text-white">{dashboardQuery.data?.byPaymentStatus?.PAID ?? '--'}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-900/80 p-3">
                    <span className="text-sm text-slate-300">Due</span>
                    <strong className="text-white">{dashboardQuery.data?.byPaymentStatus?.DUE ?? '--'}</strong>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
