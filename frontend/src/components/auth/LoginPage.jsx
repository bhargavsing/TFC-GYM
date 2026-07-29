import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.js'
import { Button } from '../ui/Button.jsx'
import { TextInput } from '../ui/Input.jsx'

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const form = useForm({ defaultValues: { username: '', password: '' } })
  const mutation = useMutation({ mutationFn: ({ username, password }) => login(username, password), onSuccess: () => navigate('/admin/dashboard') })

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1500px] grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-6 xl:px-8">
        <motion.section
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.15),_transparent_28%),#09090B] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.28)]"
        >
          <div className="absolute inset-0 opacity-40 blur-3xl" style={{ background: 'radial-gradient(circle at 10% 20%, rgba(34,197,94,0.55), transparent 18%), radial-gradient(circle at 90% 30%, rgba(14,165,233,0.5), transparent 20%), radial-gradient(circle at 50% 90%, rgba(168,85,247,0.35), transparent 25%)' }} />
          <div className="relative z-10 flex h-full flex-col justify-between gap-8 text-white">
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">TFC Premium</p>
              <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">Private operations for teams and owners.</h1>
              <p className="max-w-xl text-base leading-7 text-slate-300">Sign in to manage members, turf, payments, and operational analytics from TFC premium dashboard.</p>
            </div>
            <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="space-y-10">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Ready when you are</p>
                <div className="grid gap-2 text-2xl font-bold text-white">Admin access / SaaS</div>
              </div>
              <div className="grid gap-3">
                <div className="rounded-3xl border border-white/10 bg-slate-950/90 px-5 py-4 shadow-inner shadow-black/20">
                  <p className="text-sm text-slate-300">Everything is polished with glassmorphism, motion, and refined spacing.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-sm text-slate-200">Analytics</div>
                  <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-sm text-slate-200">Member management</div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.form
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="relative overflow-hidden rounded-[36px] border border-white/10 bg-slate-950/95 p-8 shadow-[0_40px_100px_rgba(0,0,0,0.25)]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.15),_transparent_20%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.13),_transparent_18%)]" />
          <div className="relative z-10 grid gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Admin Sign-In</p>
              <h2 className="mt-3 text-3xl font-extrabold text-white">Secure Login</h2>
            </div>
            <TextInput id="username" label="Username" {...form.register('username', { required: 'Username is required' })} error={form.formState.errors.username?.message} />
            <div className="relative">
              <TextInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                {...form.register('password', { required: 'Password is required' })}
                error={form.formState.errors.password?.message}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/5 p-2 text-slate-200 transition hover:bg-white/10"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                <input className="h-4 w-4 rounded border-white/10 bg-slate-900 text-emerald-400 focus:ring-emerald-400" type="checkbox" />
                Remember me
              </label>
              <button type="button" className="text-sm font-semibold text-emerald-300 transition hover:text-emerald-200">Forgot password?</button>
            </div>
            {mutation.isError && <p className="rounded-3xl bg-red-500/15 px-4 py-3 text-sm text-red-100">{mutation.error.message}</p>}
            <Button type="submit" className="w-full">Sign in securely</Button>
            <Button variant="outline" className="w-full text-white/80" type="button" onClick={() => navigate('/select-role')}>Back to role selection</Button>
          </div>
        </motion.form>
      </div>
    </div>
  )
}
