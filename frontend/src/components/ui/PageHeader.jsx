export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="grid gap-4 rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_35px_120px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="space-y-2">
        {eyebrow && <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">{eyebrow}</p>}
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{title}</h1>
        {description && <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">{description}</p>}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}
