import { motion } from 'framer-motion'

const variants = {
  primary:
    'bg-emerald-400 text-slate-950 shadow-[0_20px_80px_rgba(34,197,94,0.18)] hover:bg-emerald-300',
  secondary:
    'bg-sky-500 text-white shadow-[0_20px_80px_rgba(14,165,233,0.18)] hover:bg-sky-400',
  accent:
    'bg-violet-500 text-white shadow-[0_20px_80px_rgba(168,85,247,0.18)] hover:bg-violet-400',
  ghost:
    'bg-white/5 text-slate-100 ring-1 ring-white/10 hover:bg-white/10',
  danger:
    'bg-red-500 text-white shadow-[0_20px_80px_rgba(239,68,68,0.18)] hover:bg-red-400',
  outline:
    'border border-white/10 bg-transparent text-slate-100 hover:bg-white/5',
}

const sizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-sm',
  lg: 'px-5 py-3.5 text-base',
}

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className={`inline-flex items-center justify-center gap-2 rounded-3xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}
