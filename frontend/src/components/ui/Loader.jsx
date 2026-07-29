export function Loader({ className = '' }) {
  return (
    <div className={`flex items-center justify-center rounded-3xl bg-white/5 p-6 ${className}`}>
      <div className="flex items-center gap-3 text-slate-200">
        <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
        <div className="h-3 w-3 animate-pulse rounded-full bg-sky-400" />
        <div className="h-3 w-3 animate-pulse rounded-full bg-violet-400" />
      </div>
    </div>
  )
}
