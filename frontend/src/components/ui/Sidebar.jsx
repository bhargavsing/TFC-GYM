import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Wallet, Sparkles, CalendarDays, FileText, Settings2, X } from 'lucide-react'

const links = [
  { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/members', label: 'Members', icon: Users },
  { to: '/admin/payments', label: 'Payments', icon: Wallet },
  { to: '/admin/turf', label: 'Turf', icon: Sparkles },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
  { to: '/admin/feedback', label: 'Feedback', icon: FileText },
  { to: '/admin/partners', label: 'Partners', icon: Settings2 },
]

export function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-[280px] shrink-0 space-y-5 rounded-[32px] border border-white/10 bg-slate-950/80 p-5 shadow-[0_35px_120px_rgba(0,0,0,0.24)] backdrop-blur-xl xl:block">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">Workspace</p>
          <h2 className="text-2xl font-extrabold text-white">Admin Console</h2>
        </div>
        <nav className="space-y-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-semibold transition ${
                  isActive ? 'bg-gradient-to-r from-emerald-500/15 to-sky-500/10 text-white shadow-[0_10px_30px_rgba(34,197,94,0.16)]' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile off-canvas sidebar */}
      <div className={`fixed inset-0 z-40 xl:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
        <aside className={`fixed left-0 top-0 h-full w-64 space-y-5 bg-slate-950/95 p-5 shadow-xl backdrop-blur-xl transform transition-transform ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">Workspace</p>
              <h2 className="text-2xl font-extrabold text-white">Admin</h2>
            </div>
            <button onClick={onClose} className="rounded-full bg-white/5 p-2 text-white"><X size={18} /></button>
          </div>
          <nav className="space-y-2">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-semibold transition ${
                    isActive ? 'bg-gradient-to-r from-emerald-500/15 to-sky-500/10 text-white shadow-[0_10px_30px_rgba(34,197,94,0.16)]' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
      </div>
    </>
  )
}
