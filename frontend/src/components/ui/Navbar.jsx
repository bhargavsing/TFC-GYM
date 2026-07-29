import { NavLink, useNavigate } from 'react-router-dom'
import { Bell, Home, LayoutDashboard, Users, Wallet, Sparkles } from 'lucide-react'
import { useAuthStore } from '../../store/auth.js'
import { Button } from './Button.jsx'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/members', label: 'Members', icon: Users },
  { to: '/admin/payments', label: 'Payments', icon: Wallet },
  { to: '/admin/turf', label: 'Turf', icon: Sparkles },
]

export function Navbar() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  return (
    <div className="sticky top-0 z-30 mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 border-b border-white/10 bg-slate-950/80 px-5 py-4 backdrop-blur-xl backdrop-saturate-150">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/dashboard')} className="inline-flex items-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white shadow-[0_20px_80px_rgba(0,0,0,0.18)] transition hover:bg-white/10">
          <Home size={16} />
          TFC SaaS
        </button>
        <div className="hidden items-center gap-1 rounded-3xl bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.24em] text-slate-300 ring-1 ring-white/10 sm:flex">
          <span>Premium Dashboard</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="inline-flex items-center justify-center rounded-3xl bg-white/5 p-3 text-slate-100 transition hover:bg-white/10"><Bell size={18} /></button>
        <Button variant="ghost" size="sm" onClick={async () => { await logout(); window.location.assign('/admin/login') }}>Sign Out</Button>
      </div>
    </div>
  )
}
