export function StatusCard({ label, value, detail, icon, className = '' }) {
  return (
    <div className={`rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.18)] ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-bold text-white">{value}</p>
        </div>
        {icon ? <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-400/15 text-emerald-200">{icon}</div> : null}
      </div>
      {detail ? <p className="mt-4 text-sm leading-6 text-slate-300">{detail}</p> : null}
    </div>
  )
}
