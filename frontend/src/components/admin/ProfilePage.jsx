import { useEffect } from 'react'
import { useAuthStore } from '../../store/auth.js'
import { Card } from '../ui/Card.jsx'
import { PageHeader } from '../ui/PageHeader.jsx'
import { Button } from '../ui/Button.jsx'
import { User, ShieldCheck, Sparkles } from 'lucide-react'

export function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const loadMe = useAuthStore((state) => state.loadMe)

  useEffect(() => {
    if (!user) {
      loadMe().catch(() => {})
    }
  }, [user, loadMe])

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Profile" title="Admin profile" description="View your profile, security settings, and activity timeline in one polished page." />
      <Card className="rounded-[36px] bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_30%),rgba(15,23,42,0.95)]">
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="space-y-6 rounded-[32px] border border-white/10 bg-slate-950/80 p-6">
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-emerald-400/20 text-3xl text-emerald-300"><User size={32} /></div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Administrator</p>
                <p className="mt-2 text-2xl font-bold text-white">{user?.name ?? user?.username ?? 'Admin user'}</p>
                <p className="mt-1 text-sm text-slate-400">{user?.email ?? 'admin@example.com'}</p>
              </div>
            </div>
            <div className="grid gap-3">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <p className="text-sm text-slate-400">Security</p>
                <p className="mt-2 text-base text-white">Two-step authentication enabled</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <p className="text-sm text-slate-400">Member access</p>
                <p className="mt-2 text-base text-white">Admin role with full dashboard privileges</p>
              </div>
            </div>
            <Button variant="secondary">Edit profile</Button>
          </div>
          <div className="space-y-6">
            <Card className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Activity</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Recent events</h2>
                </div>
                <Sparkles size={24} className="text-emerald-300" />
              </div>
              <div className="mt-6 space-y-4">
                {['Signed in from desktop', 'Viewed payments report', 'Updated member plan', 'Generated turf schedule'].map((event) => (
                  <div key={event} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <p className="text-sm text-slate-300">{event}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6">
              <div className="flex items-center gap-3 text-slate-300">
                <ShieldCheck size={20} />
                <p className="text-sm">Account security and session controls are set to premium defaults.</p>
              </div>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  )
}
