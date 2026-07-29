export function Badge({ children, variant = 'neutral', className = '' }) {
  const styles = {
    neutral: 'bg-white/5 text-slate-100 ring-white/10',
    success: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/20',
    warning: 'bg-amber-500/15 text-amber-200 ring-amber-400/20',
    error: 'bg-red-500/15 text-red-200 ring-red-400/20',
    active: 'bg-emerald-400/15 text-emerald-200 ring-emerald-400/20',
    due: 'bg-amber-400/15 text-amber-200 ring-amber-400/20',
    overdue: 'bg-red-400/15 text-red-200 ring-red-400/20',
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] ${styles[variant] ?? styles.neutral} ${className}`}>
      {children}
    </span>
  )
}
