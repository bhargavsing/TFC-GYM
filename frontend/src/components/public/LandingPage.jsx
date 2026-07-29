import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../ui/Button.jsx'

const features = [
  'Welcome screen with plan discovery',
  'Live turf availability',
  'Feedback capture',
  'Admin operation gateway',
]

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[#09090B] text-slate-100">
      <div className="mx-auto grid max-w-[1500px] items-center gap-10 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-6 xl:px-8">
        <motion.section initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55 }} className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200">
            Built for premium fitness studios
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-5xl font-extrabold tracking-tight text-white sm:text-6xl">The modern gym SaaS experience for members, trainers, and admins.</h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">Seamless bookings, membership operations, analytics, and feedback in a luxurious dark product designed for premium fitness brands.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 sm:w-max">
            <Link to="/plans"><Button size="lg">Explore Plans</Button></Link>
            <Link to="/turf"><Button variant="secondary" size="lg">Check turf slots</Button></Link>
            <Link to="/trainers"><Button variant="ghost" size="lg">Meet our trainers</Button></Link>
          </div>
          <div className="grid gap-3 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.18)]">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">✓</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </motion.section>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }} className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.16),_transparent_18%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.14),_transparent_20%),#0b0c10] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.3)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.08),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.12),_transparent_20%)]" />
          <div className="relative grid gap-6 rounded-[28px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Gym overview</p>
              <h2 className="text-3xl font-extrabold text-white">Membership and turf in one premium view</h2>
              <p className="text-sm leading-7 text-slate-300">Modern visual design with glass panels, motion, and accessible contrast.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold text-white">1,250+</p>
                <p className="mt-2 text-sm text-slate-400">Members onboarded</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold text-white">98%</p>
                <p className="mt-2 text-sm text-slate-400">Booking satisfaction</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
