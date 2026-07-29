export function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <label className={`flex w-full items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-300 shadow-[0_20px_60px_rgba(0,0,0,0.15)] ${className}`}>
      <span className="text-slate-400">🔍</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={value ? '' : placeholder}
        className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
      />
    </label>
  )
}
