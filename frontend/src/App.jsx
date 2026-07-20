import { useEffect, useMemo, useState } from 'react'
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  createMember,
  deleteMember,
  getDashboard,
  getMembers,
  tfcApi,
  updateMember,
} from './api/members.js'
import { useAuthStore } from './store/auth.js'

const money = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const readableDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

const guestNav = [
  ['/', 'Home'],
  ['/plans', 'Plans'],
  ['/turf', 'Turf'],
  ['/feedback', 'Feedback'],
  ['/admin/login', 'Admin Login'],
]

const adminNav = [
  ['/admin/dashboard', 'Dashboard'],
  ['/admin/members', 'Members'],
  ['/admin/payments', 'Payments'],
  ['/admin/turf', 'Turf Management'],
  ['/admin/bookings', 'Bookings'],
  ['/admin/feedback', 'Feedback'],
  ['/admin/partners', 'Partners'],
]

const blankMember = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  status: 'ACTIVE',
  plan: 'STANDARD',
  paymentStatus: 'DUE',
  membershipStart: new Date().toISOString().slice(0, 10),
  membershipEnd: nextMonthDate(),
  lastPaymentAmount: 0,
  trainer: '',
  goal: '',
}

const feedbackValidation = z.object({
  name: z.string().optional(),
  email: z.email().optional().or(z.literal('')),
  phone: z.string().optional(),
  category: z.string().min(1),
  rating: z.coerce.number().min(1).max(5),
  message: z.string().min(5),
  suggestions: z.string().optional(),
  anonymous: z.boolean().optional(),
})

const plans = [
  ['BASIC', 'Basic'],
  ['STANDARD', 'Standard'],
  ['PREMIUM', 'Premium'],
  ['PERSONAL_TRAINING', 'Personal training'],
]
const statuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED']
const paymentStatuses = ['PAID', 'DUE', 'OVERDUE']

const defaultMembershipPlans = [
  {
    _id: 'default-monthly',
    name: 'Monthly Plan',
    description: 'Flexible monthly access for regular gym training.',
    durationDays: 30,
    discountedPrice: 1000,
  },
  {
    _id: 'default-quarterly',
    name: '3 Month Plan',
    description: 'A better value plan for consistent fitness progress.',
    durationDays: 90,
    discountedPrice: 2500,
  },
  {
    _id: 'default-annual',
    name: '12 Month Plan',
    description: 'Best annual value for committed TFC members.',
    durationDays: 365,
    discountedPrice: 9000,
  },
]

function nextMonthDate() {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  return date.toISOString().slice(0, 10)
}

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

function hourLabel(hour) {
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const value = hour % 12 === 0 ? 12 : hour % 12
  return `${value}:00 ${suffix}`
}

function buildFallbackTurfSlots(dateInput) {
  const now = new Date()

  return Array.from({ length: 24 }, (_, hour) => {
    const startTime = `${String(hour).padStart(2, '0')}:00`
    const endTime = `${String((hour + 1) % 24).padStart(2, '0')}:00`
    const startsAt = new Date(`${dateInput}T${startTime}:00`)

    return {
      id: `fallback-${dateInput}-${startTime}`,
      date: dateInput,
      startTime,
      endTime,
      label: `${hourLabel(hour)}-${hourLabel((hour + 1) % 24)}`,
      status: 'available',
      price: 800,
      isPast: startsAt < now,
    }
  })
}

function toDateInput(value) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}

function toMemberPayload(form) {
  return {
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email,
    phone: form.phone,
    status: form.status,
    plan: form.plan,
    paymentStatus: form.paymentStatus,
    membershipStart: form.membershipStart,
    membershipEnd: form.membershipEnd,
    lastPaymentAmount: Number(form.lastPaymentAmount || 0),
    trainer: form.trainer,
    goal: form.goal,
  }
}

function cls(...parts) {
  return parts.filter(Boolean).join(' ')
}

function PageContainer({ children, className = '' }) {
  return (
    <div className={cls('mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  )
}

function Card({ children, className = '' }) {
  return (
    <section className={cls('rounded-xl border border-zinc-200 bg-white p-5 shadow-sm', className)}>
      {children}
    </section>
  )
}

function Button({ children, tone = 'primary', className = '', ...props }) {
  const tones = {
    primary: 'bg-emerald-700 text-white hover:bg-emerald-800',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    neutral: 'border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50',
    amber: 'bg-amber-500 text-zinc-950 hover:bg-amber-400',
  }
  return (
    <button
      className={cls(
        'min-h-10 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function Badge({ children, tone = 'neutral' }) {
  const tones = {
    available: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    booked: 'bg-red-100 text-red-800 ring-red-200',
    blocked: 'bg-amber-100 text-amber-900 ring-amber-200',
    neutral: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  }
  return (
    <span className={cls('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1', tones[tone])}>
      {children}
    </span>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <label className={cls('grid gap-1.5 text-sm font-semibold text-zinc-800', className)}>
      {label}
      {children}
    </label>
  )
}

function inputClass() {
  return 'min-h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
}

function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="mb-5 flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-4xl">
        {eyebrow && <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-950 lg:text-3xl">{title}</h1>
        {description && <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  )
}

function StatCard({ label, value, hint }) {
  return (
    <Card>
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-zinc-950">{value}</p>
      <p className="mt-1 text-sm text-zinc-600">{hint}</p>
    </Card>
  )
}

function AppLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const navItems = isAuthenticated ? adminNav : guestNav

  async function handleLogout() {
    await logout()
    sessionStorage.removeItem('tfc_access_mode')
    navigate('/select-role')
  }

  return (
    <main className="min-h-screen bg-[#f7f5ef] text-zinc-950">
      <nav className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex min-h-[74px] w-full max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" to="/">
            <span className="grid size-12 place-items-center rounded-xl bg-emerald-700 text-lg font-black text-white">
              TFC
            </span>
            <span>
              <span className="block text-lg font-extrabold leading-tight text-zinc-950 sm:text-xl">TFC Gym & Turf</span>
              <span className="text-xs font-medium text-zinc-500 sm:text-sm">Jawahar Nagar Sports & Fitness</span>
            </span>
          </Link>

          <button
            className="min-h-10 rounded-lg border border-zinc-300 px-3 text-sm font-semibold lg:hidden"
            onClick={() => setMenuOpen((value) => !value)}
            type="button"
          >
            Menu
          </button>

          <div className="hidden items-center gap-2 lg:flex">
            {navItems.map(([to, label]) => (
              <NavLink
                className={({ isActive }) =>
                  cls(
                    'rounded-lg px-3 py-2 text-sm font-bold transition',
                    isActive ? 'bg-zinc-950 text-white' : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950',
                  )
                }
                key={to}
                to={to}
              >
                {label}
              </NavLink>
            ))}
            {!isAuthenticated && (
              <button
                className="rounded-lg px-3 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-100"
                onClick={() => {
                  sessionStorage.removeItem('tfc_access_mode')
                  navigate('/select-role')
                }}
                type="button"
              >
                Change access mode
              </button>
            )}
            {isAuthenticated && <Button onClick={handleLogout} tone="danger">Logout</Button>}
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-zinc-200 bg-white px-4 py-3 lg:hidden">
            <div className="grid gap-2">
              {navItems.map(([to, label]) => (
                <NavLink className="rounded-lg px-3 py-2 text-sm font-bold text-zinc-800 hover:bg-zinc-100" key={to} to={to}>
                  {label}
                </NavLink>
              ))}
              {isAuthenticated ? (
                <Button onClick={handleLogout} tone="danger">Logout</Button>
              ) : (
                <Button
                  onClick={() => {
                    sessionStorage.removeItem('tfc_access_mode')
                    navigate('/select-role')
                  }}
                  tone="neutral"
                >
                  Change access mode
                </Button>
              )}
            </div>
          </div>
        )}
      </nav>
      <PageContainer>{children}</PageContainer>
    </main>
  )
}

function RoleSelectionPage() {
  const navigate = useNavigate()

  function continueAsGuest() {
    sessionStorage.setItem('tfc_access_mode', 'guest')
    navigate('/')
  }

  function continueAsAdmin() {
    sessionStorage.setItem('tfc_access_mode', 'admin')
    navigate('/admin/login')
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 p-4 sm:p-6">
      <img alt="TFC turf" className="absolute inset-0 h-full w-full object-cover" src="/bhaiya.jpg" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-white/40" />
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-48px)] max-w-[1180px] items-center gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="max-w-2xl text-white">
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-300">TFC Gym & Turf</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
            Welcome to TFC Gym & Turf
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-100">
            Choose how you would like to continue.
          </p>
        </section>
        <section className="grid gap-5">
          <button className="rounded-xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md" onClick={continueAsGuest} type="button">
            <Badge tone="available">Guest</Badge>
            <h2 className="mt-4 text-xl font-extrabold text-zinc-950">Continue as Guest</h2>
            <p className="mt-2 text-base leading-7 text-zinc-600">
              Explore gym plans, turf availability, and submit feedback without creating an account.
            </p>
          </button>
          <button className="rounded-xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md" onClick={continueAsAdmin} type="button">
            <Badge tone="blocked">Admin</Badge>
            <h2 className="mt-4 text-xl font-extrabold text-zinc-950">Admin Login</h2>
            <p className="mt-2 text-base leading-7 text-zinc-600">
              Access bookings, members, payments, turf-slot management, partners, and administrative tools.
            </p>
          </button>
        </section>
      </div>
    </main>
  )
}

function PublicRoute({ children }) {
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const selectedMode = sessionStorage.getItem('tfc_access_mode')

  if (isAuthenticated && location.pathname === '/admin/login') {
    return <Navigate replace to="/admin/dashboard" />
  }

  if (!selectedMode && location.pathname !== '/select-role') {
    return <Navigate replace to="/select-role" />
  }

  return children
}

function ProtectedAdminRoute({ children }) {
  const [checked, setChecked] = useState(false)
  const [allowed, setAllowed] = useState(false)
  const loadMe = useAuthStore((state) => state.loadMe)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    let mounted = true
    async function verify() {
      if (!isAuthenticated) {
        setAllowed(false)
        setChecked(true)
        return
      }

      try {
        await loadMe()
        if (mounted) setAllowed(true)
      } catch {
        window.localStorage.removeItem('tfc_access_token')
        if (mounted) setAllowed(false)
      } finally {
        if (mounted) setChecked(true)
      }
    }
    verify()
    return () => {
      mounted = false
    }
  }, [isAuthenticated, loadMe])

  if (!checked) {
    return (
      <AppLayout>
        <Card>
          <p className="text-base font-bold text-zinc-900">Verifying admin access...</p>
        </Card>
      </AppLayout>
    )
  }

  if (!allowed) {
    return <Navigate replace to="/admin/login" />
  }

  return children
}

function HomePage() {
  const homeQuery = useQuery({ queryKey: ['public-home'], queryFn: tfcApi.home })
  const data = homeQuery.data
  const facilities = data?.content?.facilities ?? ['Strength training', 'Cardio', 'Premium turf', 'Floodlights']

  return (
    <AppLayout>
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl bg-white p-5 shadow-sm lg:p-7">
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">TFC Gym & Turf</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-950 lg:text-4xl">
            Train hard. Play smarter.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
            Gym memberships, turf availability, feedback, and admin operations in one calm premium system.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/plans"><Button>View Plans</Button></Link>
            <Link to="/turf"><Button tone="amber">Check Turf Slots</Button></Link>
          </div>
        </div>
        <img alt="TFC turf" className="h-[300px] w-full rounded-xl object-cover shadow-sm lg:h-full lg:min-h-[300px]" src="/bhaiya.jpg" />
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {facilities.map((facility) => (
          <Card key={facility}>
            <Badge tone="available">Facility</Badge>
            <h2 className="mt-4 text-xl font-extrabold text-zinc-950">{facility}</h2>
            <p className="mt-2 text-base leading-7 text-zinc-600">Clean, managed, and connected to TFC operations.</p>
          </Card>
        ))}
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-2xl font-extrabold text-zinc-950">Location & Timings</h2>
          <p className="mt-3 text-base text-zinc-600">{data?.content?.contact?.address ?? 'Jawahar Nagar, near Jeewan Ganga Banquet Hall'}</p>
          <p className="mt-2 text-base text-zinc-600">{data?.content?.timings ?? 'Gym 5 AM - 11 PM, Turf 6 AM - 12 AM'}</p>
        </Card>
        <Card>
          <h2 className="text-2xl font-extrabold text-zinc-950">Turf Price</h2>
          <p className="mt-3 text-base text-zinc-600">Full turf: ₹800/hour</p>
          <p className="mt-2 text-base text-zinc-600">Person wise: ₹100/person</p>
        </Card>
      </section>
    </AppLayout>
  )
}

function PlansPage() {
  const plansQuery = useQuery({ queryKey: ['plans'], queryFn: tfcApi.plans })
  const visiblePlans = plansQuery.data?.length ? plansQuery.data : defaultMembershipPlans

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Membership"
        title="Simple TFC gym plans"
        description="Choose a monthly, quarterly, or annual membership with clear pricing."
      />
      {plansQuery.isError && (
        <Card className="mb-5 border-amber-200 bg-amber-50">
          <p className="font-semibold text-amber-900">Backend plans could not be loaded, so default TFC plans are shown.</p>
        </Card>
      )}
      {!plansQuery.isPending && !plansQuery.isError && !plansQuery.data?.length && (
        <Card className="mb-5 border-amber-200 bg-amber-50">
          <p className="font-semibold text-amber-900">No plans found in MongoDB yet. Showing default TFC pricing.</p>
        </Card>
      )}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visiblePlans.map((plan) => (
          <Card className="min-h-[240px]" key={plan._id}>
            <Badge tone="available">{plan.durationDays} days</Badge>
            <h2 className="mt-4 text-xl font-extrabold text-zinc-950">{plan.name}</h2>
            <p className="mt-2 text-base leading-7 text-zinc-600">{plan.description}</p>
            <p className="mt-6 text-4xl font-extrabold text-emerald-700">{money.format(plan.discountedPrice)}</p>
            <Button className="mt-6 w-full">Join Now</Button>
          </Card>
        ))}
      </div>
    </AppLayout>
  )
}

function slotTone(slot) {
  if (slot.isPast) return 'bg-zinc-100 text-zinc-400 border-zinc-200'
  if (slot.status === 'booked') return 'bg-red-50 text-red-800 border-red-200'
  if (slot.status === 'blocked') return 'bg-amber-50 text-amber-900 border-amber-200'
  return 'bg-emerald-50 text-emerald-900 border-emerald-200'
}

function statusTone(status) {
  if (status === 'booked') return 'booked'
  if (status === 'blocked') return 'blocked'
  return 'available'
}

function TurfSlotCard({ slot, admin = false, onEdit }) {
  return (
    <div className={cls('min-h-[112px] rounded-xl border p-3.5', slotTone(slot))}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-extrabold">{slot.label}</p>
          <p className="mt-1 text-sm">{money.format(slot.price ?? 800)}</p>
        </div>
        <Badge tone={slot.isPast ? 'neutral' : statusTone(slot.status)}>
          {slot.isPast ? 'past' : slot.status}
        </Badge>
      </div>
      {admin && (
        <Button className="mt-4 w-full" onClick={() => onEdit(slot)} tone="neutral" type="button">
          Manage
        </Button>
      )}
    </div>
  )
}

function TurfPage() {
  const [date, setDate] = useState(todayInput())
  const slotsQuery = useQuery({
    queryKey: ['turf-slots', date],
    queryFn: () => tfcApi.turfSlots(date),
  })
  const slots = slotsQuery.data?.slots?.length ? slotsQuery.data.slots : buildFallbackTurfSlots(date)

  return (
    <AppLayout>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section>
          <PageHeader
            eyebrow="Turf Availability"
            title="Check all 24 hourly slots"
            description="Guests can view availability. Booked and blocked slots are visible without exposing private customer details."
          />
          {slotsQuery.isPending && <Card className="mb-5">Loading turf slots...</Card>}
          {slotsQuery.isError && (
            <Card className="mb-5 border-amber-200 bg-amber-50">
              <p className="font-semibold text-amber-900">Backend turf slots could not be loaded. Showing default available slots for now.</p>
            </Card>
          )}
          {!slotsQuery.isPending && !slotsQuery.isError && !slotsQuery.data?.slots?.length && (
            <Card className="mb-5 border-amber-200 bg-amber-50">
              <p className="font-semibold text-amber-900">No saved turf slots found for this date. Showing default hourly slots.</p>
            </Card>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {slots.map((slot) => (
              <TurfSlotCard key={`${slot.startTime}-${slot.endTime}`} slot={slot} />
            ))}
          </div>
        </section>
        <aside className="xl:sticky xl:top-28 xl:self-start">
          <Card>
            <h2 className="text-2xl font-extrabold text-zinc-950">Select Date</h2>
            <Field className="mt-5" label="Date">
              <input className={inputClass()} onChange={(event) => setDate(event.target.value)} type="date" value={date} />
            </Field>
            <div className="mt-6 rounded-2xl bg-amber-50 p-5">
              <p className="text-base font-extrabold text-zinc-950">₹800 / hour</p>
              <p className="mt-2 text-base text-zinc-600">₹100 per person for person-wise play.</p>
            </div>
          </Card>
        </aside>
      </div>
    </AppLayout>
  )
}

function FeedbackPage() {
  const form = useForm({
    resolver: zodResolver(feedbackValidation),
    defaultValues: { category: 'TURF_QUALITY', rating: 5, anonymous: false },
  })
  const mutation = useMutation({ mutationFn: tfcApi.feedback, onSuccess: () => form.reset() })

  return (
    <AppLayout>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <PageHeader eyebrow="Feedback" title="Tell us how TFC can improve" />
          <form className="grid gap-5 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <Field label="Name"><input className={inputClass()} {...form.register('name')} /></Field>
            <Field label="Email"><input className={inputClass()} {...form.register('email')} /></Field>
            <Field label="Phone"><input className={inputClass()} {...form.register('phone')} /></Field>
            <Field label="Rating"><input className={inputClass()} max="5" min="1" type="number" {...form.register('rating')} /></Field>
            <Field className="md:col-span-2" label="Category">
              <select className={inputClass()} {...form.register('category')}>
                {['GYM_EQUIPMENT', 'CLEANLINESS', 'STAFF_BEHAVIOUR', 'TRAINER_SUPPORT', 'MEMBERSHIP_PRICING', 'TURF_QUALITY', 'BOOKING_EXPERIENCE', 'WEBSITE_EXPERIENCE', 'OTHER'].map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field className="md:col-span-2" label="Message"><textarea className={`${inputClass()} min-h-36 py-3`} {...form.register('message')} /></Field>
            <Field className="md:col-span-2" label="Suggestions"><textarea className={`${inputClass()} min-h-28 py-3`} {...form.register('suggestions')} /></Field>
            <label className="flex items-center gap-3 text-sm font-semibold text-zinc-700 md:col-span-2">
              <input type="checkbox" {...form.register('anonymous')} /> Submit anonymously
            </label>
            <Button className="md:col-span-2" type="submit">Submit Feedback</Button>
            {mutation.isSuccess && <p className="text-base font-bold text-emerald-700 md:col-span-2">Feedback submitted.</p>}
          </form>
        </Card>
        <aside className="grid gap-5">
          <StatCard label="Average Rating" value="4.8" hint="Recent public reviews" />
          <Card>
            <h2 className="text-xl font-extrabold">Common Suggestions</h2>
            <div className="mt-5 grid gap-3">
              {['More evening slots', 'Trainer scheduling', 'Equipment upgrades', 'Cleaner changing rooms'].map((item) => (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700" key={item}>{item}</div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </AppLayout>
  )
}

function AdminLoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const form = useForm({
    defaultValues: { username: '', password: '' },
  })
  const mutation = useMutation({
    mutationFn: ({ username, password }) => login(username, password),
    onSuccess: () => navigate('/admin/dashboard'),
  })

  return (
    <main className="min-h-screen bg-[#f7f5ef] p-4 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-48px)] max-w-[1180px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg lg:grid-cols-[1fr_400px]">
        <section className="relative hidden lg:block">
          <img alt="TFC admin login" className="absolute inset-0 h-full w-full object-cover" src="/bhaiya.jpg" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 to-transparent" />
          <div className="absolute bottom-8 left-8 max-w-lg text-white">
            <p className="text-sm font-bold uppercase">Admin Workspace</p>
            <h1 className="mt-3 text-3xl font-extrabold">Manage members, slots, payments, and operations.</h1>
          </div>
        </section>
        <form className="grid content-center gap-5 p-5 lg:p-7" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <div>
            <p className="text-sm font-bold uppercase text-emerald-700">TFC Admin</p>
            <h1 className="mt-2 text-2xl font-extrabold text-zinc-950">Sign in</h1>
            <p className="mt-2 text-base text-zinc-600">Use your administrator username and password.</p>
          </div>
          <Field label="Name or username"><input className={inputClass()} {...form.register('username', { required: true })} /></Field>
          <Field label="Password"><input className={inputClass()} type="password" {...form.register('password', { required: true })} /></Field>
          {mutation.isError && <p className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{mutation.error.message}</p>}
          <Button type="submit">Login</Button>
          <Button onClick={() => navigate('/select-role')} tone="neutral" type="button">Back to role selection</Button>
        </form>
      </div>
    </main>
  )
}

function AdminShell({ children, title = 'Admin' }) {
  return (
    <AppLayout>
      <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-sm xl:block">
          <h2 className="text-xl font-extrabold text-zinc-950">{title}</h2>
          <nav className="mt-6 grid gap-2">
            {adminNav.map(([to, label]) => (
              <NavLink className={({ isActive }) => cls('rounded-lg px-3 py-2 text-sm font-bold', isActive ? 'bg-zinc-950 text-white' : 'text-zinc-700 hover:bg-zinc-100')} key={to} to={to}>
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </AppLayout>
  )
}

function AdminDashboard() {
  const dashboardQuery = useQuery({ queryKey: ['admin-dashboard'], queryFn: tfcApi.adminDashboard, retry: false })
  const chartData = dashboardQuery.data?.charts?.monthlyPayments?.map((row) => ({
    name: `${row._id.month}/${row._id.year}`,
    revenue: row.total,
  })) ?? [{ name: 'Demo', revenue: 1000 }]

  return (
    <AdminShell title="Dashboard">
      <PageHeader
        eyebrow="Operations"
        title="Admin Dashboard"
        description="Members, payments, turf bookings, feedback, settlements, and system status."
      />
      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
        <StatCard label="Active Members" value={dashboardQuery.data?.activeMembers ?? 0} hint="Current active memberships" />
        <StatCard label="Pending Payments" value={dashboardQuery.data?.pendingGymPayments ?? 0} hint="Gym payment follow-ups" />
        <StatCard label="Turf Bookings" value={dashboardQuery.data?.turfBookingsThisMonth ?? 0} hint="This month" />
        <StatCard label="Feedback Count" value={dashboardQuery.data?.newFeedbackItems ?? 0} hint="New feedback items" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <h2 className="text-xl font-extrabold">Revenue Chart</h2>
          <div className="mt-5 h-72">
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <CartesianGrid stroke="#e4e4e7" />
                <XAxis dataKey="name" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip />
                <Area dataKey="revenue" fill="#d1fae5" stroke="#047857" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-extrabold">Quick Actions</h2>
          <div className="mt-5 grid gap-3">
            {['Add member', 'Record payment', 'Renew membership', 'Create turf booking', 'Manage turf slots', 'Review feedback'].map((action) => (
              <button className="min-h-10 rounded-lg border border-zinc-200 px-3 text-left text-sm font-bold hover:bg-zinc-50" key={action} type="button">
                {action}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </AdminShell>
  )
}

function MemberManagementPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(blankMember)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const membersQuery = useQuery({ queryKey: ['members'], queryFn: ({ signal }) => getMembers(signal) })
  const dashboardQuery = useQuery({ queryKey: ['members-dashboard'], queryFn: ({ signal }) => getDashboard(signal) })
  const refreshData = () => Promise.all([queryClient.invalidateQueries({ queryKey: ['members'] }), queryClient.invalidateQueries({ queryKey: ['members-dashboard'] })])
  const saveMutation = useMutation({
    mutationFn: (payload) => editingId ? updateMember(editingId, payload) : createMember(payload),
    onSuccess: async () => {
      setForm(blankMember)
      setEditingId(null)
      await refreshData()
    },
  })
  const removeMutation = useMutation({ mutationFn: deleteMember, onSuccess: refreshData })
  const members = membersQuery.data ?? []
  const filteredMembers = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return members.filter((member) => [member.firstName, member.lastName, member.email, member.phone].join(' ').toLowerCase().includes(needle))
  }, [members, search])

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <AdminShell title="Members">
      <PageHeader eyebrow="Management" title="Members" description="Add, edit, renew, search, and manage TFC gym members." />
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card>
          <h2 className="text-2xl font-extrabold">{editingId ? 'Edit member' : 'Add member'}</h2>
          <form className="mt-5 grid gap-4" onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(toMemberPayload(form)) }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name"><input className={inputClass()} onChange={(event) => updateForm('firstName', event.target.value)} required value={form.firstName} /></Field>
              <Field label="Last name"><input className={inputClass()} onChange={(event) => updateForm('lastName', event.target.value)} required value={form.lastName} /></Field>
            </div>
            <Field label="Email"><input className={inputClass()} onChange={(event) => updateForm('email', event.target.value)} required type="email" value={form.email} /></Field>
            <Field label="Phone"><input className={inputClass()} onChange={(event) => updateForm('phone', event.target.value)} required value={form.phone} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Plan"><select className={inputClass()} onChange={(event) => updateForm('plan', event.target.value)} value={form.plan}>{plans.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              <Field label="Status"><select className={inputClass()} onChange={(event) => updateForm('status', event.target.value)} value={form.status}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start"><input className={inputClass()} onChange={(event) => updateForm('membershipStart', event.target.value)} required type="date" value={form.membershipStart} /></Field>
              <Field label="End"><input className={inputClass()} onChange={(event) => updateForm('membershipEnd', event.target.value)} required type="date" value={form.membershipEnd} /></Field>
            </div>
            <Field label="Payment"><select className={inputClass()} onChange={(event) => updateForm('paymentStatus', event.target.value)} value={form.paymentStatus}>{paymentStatuses.map((status) => <option key={status}>{status}</option>)}</select></Field>
            <Button type="submit">{editingId ? 'Save Member' : 'Add Member'}</Button>
          </form>
        </Card>
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold">Member Directory</h2>
              <p className="mt-2 text-base text-zinc-600">{filteredMembers.length} shown from {members.length} total members.</p>
            </div>
            <input className={`${inputClass()} w-full lg:w-96`} onChange={(event) => setSearch(event.target.value)} placeholder="Search members" value={search} />
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="sticky top-0 bg-zinc-50 text-sm font-bold text-zinc-600">
                <tr><th className="px-4 py-4">Member</th><th className="px-4 py-4">Plan</th><th className="px-4 py-4">Payment</th><th className="px-4 py-4">Dates</th><th className="px-4 py-4">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-4"><p className="text-base font-bold">{member.firstName} {member.lastName}</p><p className="text-sm text-zinc-500">{member.email}</p></td>
                    <td className="px-4 py-4 text-sm">{member.plan}</td>
                    <td className="px-4 py-4"><Badge tone={member.paymentStatus === 'PAID' ? 'available' : 'blocked'}>{member.paymentStatus}</Badge></td>
                    <td className="px-4 py-4 text-sm">{readableDate.format(new Date(member.membershipStart))} to {readableDate.format(new Date(member.membershipEnd))}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Button onClick={() => { setEditingId(member.id); setForm({ ...blankMember, ...member, membershipStart: toDateInput(member.membershipStart), membershipEnd: toDateInput(member.membershipEnd) }) }} tone="neutral" type="button">Edit</Button>
                        <Button onClick={() => { if (window.confirm('Delete this member?')) removeMutation.mutate(member.id) }} tone="danger" type="button">Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {membersQuery.isPending && <p className="p-5 text-base">Loading members...</p>}
            {!membersQuery.isPending && filteredMembers.length === 0 && <p className="p-5 text-base">No members found.</p>}
          </div>
        </Card>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Members" value={dashboardQuery.data?.totalMembers ?? members.length} hint="Total current records" />
        <StatCard label="Active" value={dashboardQuery.data?.byStatus?.ACTIVE ?? 0} hint="Active members" />
        <StatCard label="Due" value={(dashboardQuery.data?.byPaymentStatus?.DUE ?? 0) + (dashboardQuery.data?.byPaymentStatus?.OVERDUE ?? 0)} hint="Payment follow-up" />
        <StatCard label="Collected" value={money.format(dashboardQuery.data?.revenue ?? 0)} hint="Recorded member payments" />
      </div>
    </AdminShell>
  )
}

function AdminTurfManagementPage() {
  const queryClient = useQueryClient()
  const [date, setDate] = useState(todayInput())
  const [editingSlot, setEditingSlot] = useState(null)
  const [notice, setNotice] = useState('')
  const slotsQuery = useQuery({ queryKey: ['turf-slots', date], queryFn: () => tfcApi.turfSlots(date) })
  const generateMutation = useMutation({
    mutationFn: () => tfcApi.generateTurfSlots(date),
    onSuccess: async () => {
      setNotice('Hourly slots generated.')
      await queryClient.invalidateQueries({ queryKey: ['turf-slots', date] })
    },
  })
  const saveMutation = useMutation({
    mutationFn: (input) => input.id ? tfcApi.updateTurfSlot(input.id, input) : tfcApi.upsertTurfSlot(input),
    onSuccess: async () => {
      setNotice('Slot updated.')
      setEditingSlot(null)
      await queryClient.invalidateQueries({ queryKey: ['turf-slots', date] })
    },
  })

  function saveSlot(status) {
    if (!editingSlot) return
    saveMutation.mutate({
      ...editingSlot,
      date,
      status,
      price: Number(editingSlot.price || 800),
    })
  }

  return (
    <AdminShell title="Turf Management">
      <PageHeader
        eyebrow="Admin"
        title="Turf Slot Management"
        description="Generate, block, book, and reset hourly turf slots. Public availability updates after refetch."
        actions={[
          <Button key="generate" onClick={() => generateMutation.mutate()} type="button">Generate Missing Slots</Button>,
        ]}
      />
      {notice && <div className="mb-5 rounded-xl bg-emerald-50 p-4 text-base font-bold text-emerald-800">{notice}</div>}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card>
          <Field label="Date">
            <input className={`${inputClass()} max-w-sm`} onChange={(event) => setDate(event.target.value)} type="date" value={date} />
          </Field>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {(slotsQuery.data?.slots ?? []).map((slot) => (
              <TurfSlotCard admin key={`${slot.startTime}-${slot.endTime}`} onEdit={(value) => setEditingSlot(value)} slot={slot} />
            ))}
          </div>
        </Card>
        <Card className="xl:sticky xl:top-28 xl:self-start">
          <h2 className="text-2xl font-extrabold">Slot Editor</h2>
          {!editingSlot && <p className="mt-4 text-base text-zinc-600">Select a slot to manage its booking state.</p>}
          {editingSlot && (
            <div className="mt-6 grid gap-4">
              <p className="text-lg font-extrabold">{editingSlot.label}</p>
              <Field label="Price"><input className={inputClass()} onChange={(event) => setEditingSlot((slot) => ({ ...slot, price: event.target.value }))} type="number" value={editingSlot.price ?? 800} /></Field>
              <Field label="Booking name"><input className={inputClass()} onChange={(event) => setEditingSlot((slot) => ({ ...slot, bookingName: event.target.value }))} value={editingSlot.bookingName ?? ''} /></Field>
              <Field label="Phone"><input className={inputClass()} onChange={(event) => setEditingSlot((slot) => ({ ...slot, bookingPhone: event.target.value }))} value={editingSlot.bookingPhone ?? ''} /></Field>
              <Field label="Reference"><input className={inputClass()} onChange={(event) => setEditingSlot((slot) => ({ ...slot, bookingReference: event.target.value }))} value={editingSlot.bookingReference ?? ''} /></Field>
              <Field label="Internal note"><textarea className={`${inputClass()} min-h-28 py-3`} onChange={(event) => setEditingSlot((slot) => ({ ...slot, adminNote: event.target.value }))} value={editingSlot.adminNote ?? ''} /></Field>
              <div className="grid gap-3">
                <Button onClick={() => saveSlot('available')} type="button">Mark Available</Button>
                <Button onClick={() => saveSlot('booked')} tone="danger" type="button">Mark Booked</Button>
                <Button onClick={() => saveSlot('blocked')} tone="amber" type="button">Mark Blocked</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminShell>
  )
}

function PlaceholderAdminPage({ title }) {
  return (
    <AdminShell title={title}>
      <PageHeader eyebrow="Admin" title={title} description="This protected management area is available only to authenticated admins." />
      <Card><p className="text-base text-zinc-600">Management tools for {title.toLowerCase()} will appear here.</p></Card>
    </AdminShell>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<RoleSelectionPage />} path="/select-role" />
      <Route element={<PublicRoute><HomePage /></PublicRoute>} path="/" />
      <Route element={<PublicRoute><PlansPage /></PublicRoute>} path="/plans" />
      <Route element={<PublicRoute><TurfPage /></PublicRoute>} path="/turf" />
      <Route element={<PublicRoute><FeedbackPage /></PublicRoute>} path="/feedback" />
      <Route element={<AdminLoginPage />} path="/admin/login" />
      <Route element={<Navigate replace to="/admin/dashboard" />} path="/admin" />
      <Route element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} path="/admin/dashboard" />
      <Route element={<ProtectedAdminRoute><MemberManagementPage /></ProtectedAdminRoute>} path="/admin/members" />
      <Route element={<ProtectedAdminRoute><PlaceholderAdminPage title="Payments" /></ProtectedAdminRoute>} path="/admin/payments" />
      <Route element={<ProtectedAdminRoute><AdminTurfManagementPage /></ProtectedAdminRoute>} path="/admin/turf" />
      <Route element={<ProtectedAdminRoute><PlaceholderAdminPage title="Bookings" /></ProtectedAdminRoute>} path="/admin/bookings" />
      <Route element={<ProtectedAdminRoute><PlaceholderAdminPage title="Feedback" /></ProtectedAdminRoute>} path="/admin/feedback" />
      <Route element={<ProtectedAdminRoute><PlaceholderAdminPage title="Partners" /></ProtectedAdminRoute>} path="/admin/partners" />
      <Route element={<Navigate replace to="/select-role" />} path="*" />
    </Routes>
  )
}
