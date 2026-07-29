import { useNavigate } from 'react-router-dom'
import { Card } from '../ui/Card.jsx'
import { Button } from '../ui/Button.jsx'
import { Badge } from '../ui/Badge.jsx'

export function RoleSelectionPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-[#09090B] text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1200px] gap-8 px-4 py-10 xl:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">The Fitness Coach</p>
            <h1 className="max-w-3xl text-5xl font-extrabold tracking-tight text-white">Choose your access path for TFC -</h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">Continue as a guest to explore gym plans, turf availability, and feedback. Sign in as an admin for the full dashboard experience.</p>
          </div>

          <div className="mx-auto w-full max-w-[440px]">
            <div className="relative overflow-hidden rounded-[28px] border border-emerald-400/20 bg-slate-950/80 shadow-[0_30px_90px_rgba(16,185,129,0.18)] transition duration-500 hover:-translate-y-0.5 hover:shadow-[0_35px_110px_rgba(16,185,129,0.28)]">
              <img
                src="/bhaiya.jpg"
                alt="Ganesh Surkali"
                className="h-[420px] w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_30%)]" />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center space-y-5">
          <Card className="space-y-4 w-full max-w-[460px]">
            <div className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-950/80 p-5">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">Guest access</p>
              </div>
              <Badge variant="success">Open</Badge>
            </div>
            <p className="text-sm leading-7 text-slate-300">Browse plans, view and book turf slots, and share feedback.</p>
            <Button variant="secondary" className="w-full" onClick={() => { sessionStorage.setItem('tfc_access_mode', 'guest'); navigate('/') }}>
              Continue as guest
            </Button>
          </Card>
          <Card className="space-y-4 w-full max-w-[460px]">
            <div className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-950/80 p-5">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Admin access</p>
                <h2 className="mt-2 text-xl font-bold text-white">Sign in securely</h2>
              </div>
              <Badge variant="accent">Admin</Badge>
            </div>
            <p className="text-sm leading-7 text-slate-300">Manage members, payments, bookings, and analytics from the premium dashboard.</p>
            <Button className="w-full" onClick={() => { sessionStorage.setItem('tfc_access_mode', 'admin'); navigate('/admin/login') }}>
              Admin login
            </Button>
          </Card>
        </div>
      </div>
    </main>
  )
}
