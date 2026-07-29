export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-3 rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_58px_rgba(255,255,255,0.05)] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">{subtitle}</p>
        <h2 className="mt-2 text-2xl font-bold text-white">{title}</h2>
      </div>
      {action}
    </div>
  )
}
